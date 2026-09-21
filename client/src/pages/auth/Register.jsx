import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { register, reset } from '../../features/auth/authSlice';

const Register = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const { firstName, lastName, email, password, confirmPassword } = formData;

  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { user, isLoading, isError, isSuccess, message } = useSelector(
    (state) => state.auth
  );

  useEffect(() => {
    if (isError) {
      console.error(message);
    }

    if (isSuccess || user) {
      navigate('/dashboard');
    }

    dispatch(reset());
  }, [user, isError, isSuccess, message, navigate, dispatch]);

  const onChange = (e) => {
    setFormData((prevState) => ({
      ...prevState,
      [e.target.name]: e.target.value,
    }));
  };

  const onSubmit = (e) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      alert('Passwords do not match');
    } else {
      const userData = {
        firstName,
        lastName,
        email,
        password,
      };

      dispatch(register(userData));
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg)] flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-[var(--navy)] tracking-tight">
          Register a new account
        </h2>
        <p className="mt-2 text-center text-sm text-[var(--muted)]">
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-[var(--primary)] hover:text-blue-500">
            Sign in
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-[var(--surface)] py-8 px-4 shadow-sm sm:rounded-xl sm:px-10 border border-[var(--line)]">
          
          {isError && (
            <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
              <div className="flex">
                <div className="ml-3">
                  <p className="text-sm text-red-700">{message}</p>
                </div>
              </div>
            </div>
          )}

          <form className="space-y-6" onSubmit={onSubmit}>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="firstName"
                  className="block text-sm font-medium text-[var(--ink)]"
                >
                  First Name
                </label>
                <div className="mt-1">
                  <input
                    id="firstName"
                    name="firstName"
                    type="text"
                    required
                    value={firstName}
                    onChange={onChange}
                    className="appearance-none block w-full px-3 py-2 border border-[var(--line)] rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-[var(--primary)] focus:border-[var(--primary)] sm:text-sm bg-transparent text-[var(--ink)]"
                  />
                </div>
              </div>
              
              <div>
                <label
                  htmlFor="lastName"
                  className="block text-sm font-medium text-[var(--ink)]"
                >
                  Last Name
                </label>
                <div className="mt-1">
                  <input
                    id="lastName"
                    name="lastName"
                    type="text"
                    required
                    value={lastName}
                    onChange={onChange}
                    className="appearance-none block w-full px-3 py-2 border border-[var(--line)] rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-[var(--primary)] focus:border-[var(--primary)] sm:text-sm bg-transparent text-[var(--ink)]"
                  />
                </div>
              </div>
            </div>

            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-[var(--ink)]"
              >
                Email address
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={onChange}
                  className="appearance-none block w-full px-3 py-2 border border-[var(--line)] rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-[var(--primary)] focus:border-[var(--primary)] sm:text-sm bg-transparent text-[var(--ink)]"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-[var(--ink)]"
              >
                Password
              </label>
              <div className="mt-1">
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={password}
                  onChange={onChange}
                  className="appearance-none block w-full px-3 py-2 border border-[var(--line)] rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-[var(--primary)] focus:border-[var(--primary)] sm:text-sm bg-transparent text-[var(--ink)]"
                />
              </div>
            </div>
            
            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium text-[var(--ink)]"
              >
                Confirm Password
              </label>
              <div className="mt-1">
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={onChange}
                  className="appearance-none block w-full px-3 py-2 border border-[var(--line)] rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-[var(--primary)] focus:border-[var(--primary)] sm:text-sm bg-transparent text-[var(--ink)]"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[var(--primary)] hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--primary)] disabled:opacity-50 transition-colors"
              >
                {isLoading ? 'Registering...' : 'Register'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Register;
