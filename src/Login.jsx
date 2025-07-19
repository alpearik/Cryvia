import { useState } from 'react'
import { supabase } from './supabaseClient';
import { useNavigate } from 'react-router-dom';

function Login({setUser}) {
  const [username, setUsername] = useState('');
  const navigate = useNavigate();

  async function handleLogin() {
    if(!username) return;
    
    // Check if the user already exist
    const{data: existingUser}= await supabase.from('users').select('*').eq('username',username).single();

    if(existingUser){
      setUser(existingUser);
      navigate('/dashboard');
    }
    else{
      const{data: newUser, error: insertError} = await supabase.from('users').insert({username}).select().single();
      if(insertError){
         console.error(insertError);
         return;
      }
      setUser(newUser);
      navigate('/dashboard');
    }
  }

  return (
    <div>
      <h1>Cryvia</h1>
        <div>
          <input placeholder="Enter Username" value={username} onChange={(e) => setUsername(e.target.value)}></input>
          <button onClick={handleLogin}>Log in</button>
        </div> 
    </div>
  );
}

export default Login
