import { useSelector } from 'react-redux';
import MainLayout from '../layouts/MainLayout.jsx';
import CitizenDashboard from '../components/citizen/CitizenDashboard.jsx';
import OfficerDashboard from '../components/officer/OfficerDashboard.jsx';

function Home() {
  const activeView = useSelector((state) => state.ui.activeView);

  return (
    <MainLayout>
      {activeView === 'citizen' ? <CitizenDashboard /> : <OfficerDashboard />}
    </MainLayout>
  );
}

export default Home;
