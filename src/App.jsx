import { useEffect, useState } from 'react';
import DashBoard from './pages/DashBoard/DashBoard';
import { auth, db } from './firebase';
import { doc, getDoc } from 'firebase/firestore';
import { Route, Routes, Navigate } from 'react-router-dom';

export default function App() {
  const [userName, setUserName] = useState('');
  const [userRole, setUserRole] = useState('');
  const [registrationDate, setRegistrationDate] = useState('');
  const [isLoading, setIsLoading] = useState(true); // Состояние загрузки
  const [isAuthenticatedAsAdmin, setIsAuthenticatedAsAdmin] = useState(false); // Состояние для роли "admin"

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            const data = userDoc.data();
            setUserName(data.name || '');
            setUserRole(data.role || '');
            setRegistrationDate(data.registrationDate || '');

            // Проверка роли: только Админ может видеть админку
            if (data.role === 'admin') {
              setIsAuthenticatedAsAdmin(true);
            } else {
              alert('Недостаточно прав. Вы не являетесь администратором.');
              window.location.href = 'https://lms-theta-nine.vercel.app/login'; // Перенаправляем на внешнюю страницу логина
            }
          } else {
            console.log('Документ пользователя не найден в Firestore');
            window.location.href = 'https://lms-theta-nine.vercel.app/login'; // Перенаправляем на логин, если данные отсутствуют
          }
        } catch (error) {
          console.error('Ошибка при загрузке данных пользователя:', error);
          window.location.href = 'https://lms-theta-nine.vercel.app/login'; // Перенаправляем на логин в случае ошибки
        }
      } else {
        window.location.href = 'https://lms-theta-nine.vercel.app/login'; // Если пользователь не авторизован, перенаправляем на логин
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    await auth.signOut();
    setIsAuthenticatedAsAdmin(false);
    window.location.href = 'https://lms-theta-nine.vercel.app/login'; // Перенаправляем на внешнюю страницу логина после выхода
  };

  if (isLoading) {
    return <div>Загрузка...</div>; // Пока статус не определён, показываем загрузку
  }

  // Если пользователь не авторизован как администратор, ничего не рендерим (перенаправление уже произошло)
  if (!isAuthenticatedAsAdmin) {
    return null;
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
