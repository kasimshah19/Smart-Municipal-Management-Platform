import Header from '../components/Header.jsx';
import Footer from '../components/Footer.jsx';
import Toast from '../components/Toast.jsx';

function MainLayout({ children }) {
  return (
    <div className="flex min-h-screen flex-col font-sans" style={{ backgroundColor: 'var(--bg)', color: 'var(--ink)' }}>
      <Header />
      
      <main className="flex-1 w-full max-w-[1040px] mx-auto px-5 py-8">
        {children}
      </main>

      <Footer />
      <Toast />
    </div>
  );
}

export default MainLayout;
