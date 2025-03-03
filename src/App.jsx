import { useEffect, useState } from 'react';
import DashBoard from './pages/DashBoard/DashBoard';
import { auth, db, getAuthToken } from './firebase'; // Импортируем getAuthToken
import { doc, getDoc } from 'firebase/firestore';
import { Route, Routes } from 'react-router-dom';

export default function App() {
  const [userName, setUserName] = useState('');
  const [userRole, setUserRole] = useState('');
  const [registrationDate, setRegistrationDate] = useState('');
  const [isLoading, setIsLoading] = useState(true); // Состояние загрузки
  const [authLoading, setAuthLoading] = useState(true); // Состояние загрузки авторизации
  const [error, setError] = useState(null); // Состояние для ошибок

  // Обработка токена из URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');

    if (token) {
      // Убедимся, что auth корректно инициализирован
      if (typeof auth.signInWithCustomToken === 'function') {
        auth
          .signInWithCustomToken(token)
          .then(() => {
            console.log('Сессия восстановлена через токен');
          })
          .catch((error) => {
            console.error('Ошибка восстановления сессии:', error);
            setError('Ошибка восстановления сессии: ' + error.message);
          });
      } else {
        console.error('auth.signInWithCustomToken не найден. Проверь версию Firebase.');
        setError('Ошибка: Firebase Authentication не инициализирован корректно.');
      }
    }
  }, [auth]); // Зависимость от auth

  useEffect(() => {
    let unsubscribe;
    const checkAuthAndRole = async () => {
      try {
        // Устанавливаем подписку на изменения состояния авторизации
        unsubscribe = auth.onAuthStateChanged(async (user) => {
          setAuthLoading(true); // Начинаем загрузку авторизации
          console.log(
            'Состояние авторизации (raw):',
            user ? 'Авторизован' : 'Не авторизован, но возможно восстанавливается',
          );

          if (user) {
            // Проверяем данные пользователя из Firestore
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
                  }, 10000); // Увеличили задержку до 10 секунд для отладки
                  return;
                }
              } else {
                console.log('Документ пользователя не найден в Firestore');
                alert('Пользователь не найден в базе данных.');
                setTimeout(() => {
                  window.location.href = 'https://lms-theta-nine.vercel.app/login';
                }, 10000); // Увеличили задержку до 10 секунд для отладки
                return;
              }
            } catch (docError) {
              console.error('Ошибка при загрузке данных пользователя:', docError);
              setError('Ошибка при загрузке данных: ' + docError.message);
              setTimeout(() => {
                window.location.href = 'https://lms-theta-nine.vercel.app/login';
              }, 10000); // Увеличили задержку до 10 секунд для отладки
              return;
            }
          } else {
            // Пользователь не авторизован или сессия восстанавливается
            console.log('Пользователь не авторизован, пытаемся дождаться восстановления сессии...');
            // Ждём больше времени, чтобы дать Firebase восстановить сессию
            setTimeout(() => {
              const currentUser = auth.currentUser;
              if (currentUser) {
                console.log('Сессия восстановлена, пользователь:', currentUser);
                // Повторяем проверку с восстановленным пользователем
                checkAuthAndRoleWithUser(currentUser);
              } else {
                console.log('Сессия не восстановлена, перенаправляем на логин');
                setTimeout(() => {
                  window.location.href = 'https://lms-theta-nine.vercel.app/login';
                }, 5000); // Задержка 5 секунд для отладки
              }
            }, 5000); // Увеличили до 5 секунд перед повторной проверкой
          }
          setAuthLoading(false);
          setIsLoading(false);
        });
      } catch (error) {
        console.error('Ошибка в процессе авторизации:', error);
        setError('Произошла ошибка авторизации: ' + error.message);
        setTimeout(() => {
          window.location.href = 'https://lms-theta-nine.vercel.app/login';
        }, 10000); // Задержка 10 секунд для отладки
      }
    };

    const checkAuthAndRoleWithUser = async (user) => {
      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          console.log('Повторные данные пользователя из Firestore:', data);
          setUserName(data.name || '');
          setUserRole(data.role || '');
          setRegistrationDate(data.registrationDate || '');

          if (data.role === 'admin') {
            console.log('Роль "admin" подтверждена после восстановления');
          } else {
            console.log('Роль не "admin" после восстановления, перенаправляем на логин');
            alert('Недостаточно прав. Вы не являетесь администратором.');
            window.location.href = 'https://lms-theta-nine.vercel.app/login';
            return;
          }
        } else {
          console.log('Документ пользователя не найден после восстановления');
          window.location.href = 'https://lms-theta-nine.vercel.app/login';
          return;
        }
      } catch (error) {
        console.error('Ошибка при повторной проверке данных:', error);
        window.location.href = 'https://lms-theta-nine.vercel.app/login';
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
