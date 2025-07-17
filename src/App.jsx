import { useState } from 'react'
import { supabase } from './supabaseClient';

function App() {
  const [username, setUsername] = useState('');
  const [user, setUser] = useState(null);

  async function handleLogin() {
    if(!username) return;
    
    // Check if the user already exist
    const{data: existingUser}= await supabase.from('users').select('*').eq('username',username).single();

    if(existingUser){
      setUser(existingUser);
    }
    else{
      const{data: newUser, error: insertError} = await supabase.from('users').insert({username}).select().single();
      if(insertError){
         console.error(insertError);
         return;
      }
      setUser(newUser);
    }

  }

  return (
    <div>
      <h1>Cryvia</h1>
      {!user ? (
        <div>
          <input placeholder="Enter Username" value={username} onChange={(e) => setUsername(e.target.value)}></input>
          <button onClick={handleLogin}>Log in</button>
        </div>) 
        : (
        <h2>Welcome, {user.username} </h2>
        )}
    </div>
  );
}

export default App
