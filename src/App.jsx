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

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      setAuthLoading(false); // Завершаем загрузку авторизации
      if (user) {
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            const data = userDoc.data();
            console.log('Данные пользователя:', data); // Для отладки
            setUserName(data.name || '');
            setUserRole(data.role || '');
            setRegistrationDate(data.registrationDate || '');
            if (data.role === 'admin') {
              // Всё в порядке, рендерим админку
            } else {
              alert('Недостаточно прав. Вы не являетесь администратором.');
              window.location.href = 'https://lms-theta-nine.vercel.app/login'; // Перенаправляем на логин, а не на signUp
              return;
            }
          } else {
            console.log('Документ пользователя не найден');
            window.location.href = 'https://lms-theta-nine.vercel.app/login';
            return;
          }
        } catch (error) {
          console.error('Ошибка при загрузке данных пользователя:', error);
          window.location.href = 'https://lms-theta-nine.vercel.app/login';
          return;
        }
      } else {
        window.location.href = 'https://lms-theta-nine.vercel.app/login'; // Перенаправляем на логин, а не на signUp
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    await auth.signOut();
    window.location.href = 'https://lms-theta-nine.vercel.app/login';
  };

  if (authLoading || isLoading) {
    return <div>Загрузка...</div>; // Пока авторизация или данные загружаются, показываем загрузку
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
