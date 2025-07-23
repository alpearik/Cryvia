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

    try {
      const res = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${coinIds}&vs_currencies=usd`);
      const result = await res.json();
            
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

  async function handleBuy(symbol, amount) {
    if (!amount || amount <= 0) {
      alert('Please enter a valid amount');
      return;
    }

    const usdtAsset = assets.find(a => a.symbol.toUpperCase() === 'USDT');
    const cost = amount * prices[symbol.toUpperCase()];
    
    if (!usdtAsset || usdtAsset.amount < cost) {
      alert('Insufficient USDT balance');
      return;
    }

    try {
      const { error: usdtError } = await supabase
        .from('assets')
        .update({ amount: usdtAsset.amount - cost })
        .eq('user_id', user.id)
        .eq('symbol', 'usdt');

      if (usdtError){
        console.log("error:", usdtError);
        return;
      }

      const existingAsset = assets.find(a => a.symbol.toUpperCase() === symbol.toUpperCase());
      if (existingAsset && existingAsset.amount > 0) {
        const { error: updateError } = await supabase
          .from('assets')
          .update({ amount: existingAsset.amount + amount })
          .eq('user_id', user.id)
          .eq('symbol', symbol.toLowerCase());
          
        if (updateError){
          console.log("error:", updateError);
          return;
        }

      } else {
        const { error: insertError } = await supabase
          .from('assets')
          .insert({ user_id: user.id, symbol: symbol.toLowerCase(), amount });
          
        if (insertError){
          console.log("error:", insertError);
          return;
        }
      }

      await fetchAssets();
      alert(`Successfully bought ${amount} ${symbol}`);
    } catch (error) {
      console.error('Error processing buy:', error);
      alert('Error processing buy transaction');
    }
  }

  async function handleSell(symbol, amount) {
    if (!amount || amount <= 0) {
      alert('Please enter a valid amount');
      return;
    }

    const currentAsset = assets.find(a => a.symbol.toUpperCase() === symbol.toUpperCase());
    if (!currentAsset || currentAsset.amount < amount) {
      alert('Insufficient asset amount');
      return;
    }

    try {
      const newAmount = currentAsset.amount - amount;
      let assetUpdate;
      if (newAmount === 0) {
        assetUpdate = await supabase
          .from('assets')
          .delete()
          .eq('user_id', user.id)
          .eq('symbol', symbol.toLowerCase());
      } else {
        assetUpdate = await supabase
          .from('assets')
          .update({ amount: newAmount })
          .eq('user_id', user.id)
          .eq('symbol', symbol.toLowerCase());
      }

      if (assetUpdate.error){
        console.log("error",assetUpdate.error);
      }

      const usdtAsset = assets.find(a => a.symbol.toUpperCase() === 'USDT');
      const proceeds = amount * prices[symbol.toUpperCase()];
      
      if (usdtAsset) {
        const { error: usdtError } = await supabase
          .from('assets')
          .update({ amount: usdtAsset.amount + proceeds })
          .eq('user_id', user.id)
          .eq('symbol', 'usdt');
          
        if (usdtError){
          console.log("error:", usdtError);
          return;
        }

      } else {
        const { error: insertError } = await supabase
          .from('assets')
          .insert({ user_id: user.id, symbol: 'usdt', amount: proceeds });
          
        if (insertError){
          console.log("error:", insertError);
          return;
        }
      }

      await fetchAssets();
      alert(`Successfully sold ${amount} ${symbol}`);
    } catch (error) {
      console.error('Error processing sell:', error);
      alert('Error processing sell transaction');
    }
  }

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
