import { useEffect, useState } from 'react';
import { supabase } from './supabaseClient';

function Dashboard({user}){
  const [assets, setAssets] = useState([]);

  useEffect(() => {
    fetchAssets();
}, []);

  async function fetchAssets(){
    const { data:assetsUser, error:fetchError } = await supabase
    .from('assets')
    .select('*')
    .eq('user_id', user.id);

    if (fetchError) {
      console.error("Error fetching assets:", fetchError);
    } else {
      setAssets(assetsUser);
    }
  }

  return (
    <div>
      <h2>Welcome {user.username}</h2>

      <h2>Your Wallet:</h2>
      <ul>
        {assets.map((asset) => (
          <li key={asset.symbol}>
            {asset.symbol.toUpperCase()}: {asset.amount}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default Dashboard;
