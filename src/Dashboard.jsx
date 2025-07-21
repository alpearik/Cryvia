import { useEffect, useState } from 'react';
import { supabase } from './supabaseClient';

function Dashboard({user}){
  //const API_KEY = import.meta.env.VITE_CMC_API_KEY;

  const [assets, setAssets] = useState([]);
  const [totalValue, setTotalValue] = useState(0);


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
      calculateTotalValue(assetsUser);
    }
  }
  async function calculateTotalValue(assetList) {
    const idsMap = {
      BTC: 'bitcoin',
      ETH: 'ethereum',
      SOL: 'solana',
      USDT: 'tether'
    };
    
    const coinIds = assetList
    .map(a => idsMap[a.symbol.toUpperCase()])
    .filter(Boolean)
    .join(',');


    try {
      const res = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${coinIds}&vs_currencies=usd`);
      const result = await res.json();
      
      let total = 0;
      for (let asset of assetList) {
        const symbol = asset.symbol.toUpperCase();
        const id = idsMap[symbol];
        const price = result[id]?.usd || 0;
        total += asset.amount * price;
      }

      setTotalValue(total);
    } catch (error) {
      console.error("Error fetching prices:", error);
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
      <h2>Total value: ${totalValue}</h2>
    </div>
  );
}

export default Dashboard;
