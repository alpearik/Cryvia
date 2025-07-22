import { useEffect, useState } from 'react';
import { supabase } from './supabaseClient';
import CryptoCard from './components/CryptoCard';

function Dashboard({user}){

  const [assets, setAssets] = useState([]);
  const [totalValue, setTotalValue] = useState(0);
  const [prices, setPrices] = useState({});

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
    const allSymbols = Object.keys(idsMap);

    const userAssetsMap = {};
    assetList.forEach(a => {
      userAssetsMap[a.symbol.toUpperCase()] = a;
    });

    const fullAssetList = allSymbols.map(symbol => {
      return userAssetsMap[symbol] || { symbol, amount: 0 };
    });
    
    const coinIds = allSymbols.map(symbol => idsMap[symbol]).join(',');

    console.log("Fetching prices for IDs:", coinIds);

    try {
      const res = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${coinIds}&vs_currencies=usd`);
      const result = await res.json();
      
      console.log("Price API result:", result);
      
      let total = 0;
      const newPrices = {};
      for (let asset of fullAssetList) {
        const symbol = asset.symbol.toUpperCase();
        const id = idsMap[symbol];
        const price = result[id]?.usd || 0;
        newPrices[symbol] = price;
        total += asset.amount * price;
      }


      setPrices(newPrices);
      setTotalValue(total);
      setAssets(fullAssetList);
    } catch (error) {
      console.error("Error fetching prices:", error);
    }
  }

  const handleBuy = (symbol) => {
    alert(`Buy ${symbol}`);
  };

  const handleSell = (symbol) => {
    alert(`Sell ${symbol}`);
  };

  return (
    <div>
      <h2>Welcome {user.username}</h2>

      <h2>Your Wallet:</h2>
        <div>
        {assets.map((asset) => (
          <CryptoCard
            key={asset.symbol}
            asset={asset}
            currentPrice={prices[asset.symbol.toUpperCase()]}
            onBuy={handleBuy}
            onSell={handleSell}
          />
        ))}
      </div>
      <h2>Total value: ${totalValue.toFixed(2)}</h2>
    </div>
  );
}

export default Dashboard;
