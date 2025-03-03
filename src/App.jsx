import { useEffect, useState } from 'react';
import DashBoard from './pages/DashBoard/DashBoard';
import { auth, db } from './firebase';
import { doc, getDoc } from 'firebase/firestore';
import { Route, Routes } from 'react-router-dom';

export default function App() {
  const [userName, setUserName] = useState('');
  const [userRole, setUserRole] = useState('');
  const [registrationDate, setRegistrationDate] = useState('');
  const [isLoading, setIsLoading] = useState(true); // Состояние загрузки
  const [authLoading, setAuthLoading] = useState(true); // Состояние загрузки авторизации
  const [error, setError] = useState(null); // Состояние для ошибок

  useEffect(() => {
    let unsubscribe;
    const checkAuthAndRole = async () => {
      try {
        // Устанавливаем подписку на изменения состояния авторизации
        unsubscribe = auth.onAuthStateChanged(async (user) => {
          setAuthLoading(true); // Начинаем загрузку авторизации
          console.log('Состояние авторизации:', user ? 'Авторизован' : 'Не авторизован');

          if (user) {
            // Ждём, пока данные авторизации загрузятся
            try {
              const userDoc = await getDoc(doc(db, 'users', user.uid));
              if (userDoc.exists()) {
                const data = userDoc.data();
                console.log('Данные пользователя из Firestore:', data); // Для отладки
                setUserName(data.name || '');
                setUserRole(data.role || '');
                setRegistrationDate(data.registrationDate || '');

                if (data.role === 'admin') {
                  console.log('Роль "admin" подтверждена, рендерим админку');
                  // Всё в порядке, рендерим админку
                } else {
                  console.log('Роль не "admin", перенаправляем на логин');
                  alert('Недостаточно прав. Вы не являетесь администратором.');
                  setTimeout(() => {
                    window.location.href = 'https://lms-theta-nine.vercel.app/login';
                  }, 2000); // Задержка в 2 секунды для отладки
                  return;
                }
              } else {
                console.log('Документ пользователя не найден в Firestore');
                alert('Пользователь не найден в базе данных.');
                setTimeout(() => {
                  window.location.href = 'https://lms-theta-nine.vercel.app/login';
                }, 2000); // Задержка в 2 секунды для отладки
                return;
              }
            } catch (docError) {
              console.error('Ошибка при загрузке данных пользователя:', docError);
              setError('Ошибка при загрузке данных: ' + docError.message);
              setTimeout(() => {
                window.location.href = 'https://lms-theta-nine.vercel.app/login';
              }, 2000); // Задержка в 2 секунды для отладки
              return;
            }
          } else {
            console.log('Пользователь не авторизован, перенаправляем на логин');
            setTimeout(() => {
              window.location.href = 'https://lms-theta-nine.vercel.app/login';
            }, 2000); // Задержка в 2 секунды для отладки
          }
        });
      } catch (error) {
        console.error('Ошибка в процессе авторизации:', error);
        setError('Произошла ошибка авторизации: ' + error.message);
        setTimeout(() => {
          window.location.href = 'https://lms-theta-nine.vercel.app/login';
        }, 2000); // Задержка в 2 секунды для отладки
      } finally {
        setAuthLoading(false);
        setIsLoading(false);
      }
    };

    checkAuthAndRole();

    return () => unsubscribe && unsubscribe(); // Очищаем подписку
  }, []);

  const handleLogout = async () => {
    await auth.signOut();
    window.location.href = 'https://lms-theta-nine.vercel.app/login';
  };

  if (authLoading || isLoading) {
    return <div>Загрузка...</div>; // Пока авторизация или данные загружаются, показываем загрузку
  }

  if (error) {
    return <div style={{ color: 'red' }}>{error}</div>; // Показываем ошибку, если она есть
  }

  return (
    <Routes>
      <Route
        path='/dashboard'
        element={
          <DashBoard
            userName={userName}
            userRole={userRole}
            registrationDate={registrationDate}
            handleLogout={handleLogout}
          />
        }
      />
    </Routes>
  );
}
