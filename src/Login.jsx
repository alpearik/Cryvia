import { useState } from 'react'
import { supabase } from './supabaseClient';
import { useNavigate } from 'react-router-dom';

function Login({setUser}){
  const [username, setUsername] = useState('');
  const navigate = useNavigate();

  async function handleLogin(){
    if(!username) return;
    
    // Check if the user already exist
    const{data: existingUser}= await supabase
    .from('users')
    .select('*')
    .eq('username',username)
    .single();

    if(existingUser){
      setUser(existingUser);
      navigate('/dashboard');
    }
    else{
      const{data: newUser, error: insertError} = await supabase
      .from('users')
      .insert({username})
      .select()
      .single();

      if(insertError){
         console.error(insertError);
         return;
      }
      setUser(newUser);

      const { error: assetError } = await supabase
      .from('assets')
      .insert({user_id: newUser.id,symbol: 'usdt',amount: 1000,});

      if (assetError) console.error("Error assigning wallet :", assetError);
      navigate('/dashboard');
    }
  }

  return (
    <div>
      <h1>Cryvia</h1>
        <div>
          <input placeholder="Enter Username" value={username} onChange={(e) => 
            setUsername(e.target.value)}></input>
          <button onClick={handleLogin}>Log in</button>
        </div> 
    </div>
  );
}

export default Login
