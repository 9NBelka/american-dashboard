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

            // Если роль не "admin", перенаправляем на логин
            if (data.role !== 'admin') {
              alert('Недостаточно прав. Вы не являетесь администратором.');
              window.location.href = 'https://lms-theta-nine.vercel.app/login';
              return;
            }
          } else {
            console.log('Документ пользователя не найден в Firestore');
            window.location.href = 'https://lms-theta-nine.vercel.app/login';
            return;
          }
        } catch (error) {
          console.error('Ошибка при загрузке данных пользователя:', error);
          window.location.href = 'https://lms-theta-nine.vercel.app/login';
          return;
        }
      } else {
        window.location.href = 'https://lms-theta-nine.vercel.app/login';
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    await auth.signOut();
    window.location.href = 'https://lms-theta-nine.vercel.app/login';
  };

  if (isLoading) {
    return <div>Загрузка...</div>;
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
