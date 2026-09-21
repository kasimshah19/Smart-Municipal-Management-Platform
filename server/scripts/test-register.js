const register = async () => {
  const res = await fetch('http://localhost:5000/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      firstName: 'Test',
      lastName: 'User',
      email: 'testuser2@example.com',
      password: 'securepassword123'
    })
  });
  const data = await res.json();
  console.log(data);
};
register();
