import React from 'react';
import {useState} from 'react';

const CryptoCard = ({asset, currentPrice, image, onBuy, onSell}) => {
  const [buyAmount, setBuyAmount] = useState('');
  const [sellAmount, setSellAmount] = useState('');

  return (
    <div>
      <div>
        <img src={image} alt={asset.symbol} width={40} height={40} />
        <h3>{asset.symbol.toUpperCase()}</h3>
        <p>Amount: {asset.amount.toFixed(4)}</p>
        <p>Price: ${currentPrice ? currentPrice.toFixed(2) : '0'}</p>
        <p>Value: ${(asset.amount * (currentPrice || 0)).toFixed(2)}</p>
      </div>
      <div>
        <div>
          <input
            type="number"
            placeholder="Amount to buy"
            value={buyAmount}
            onChange={(e) => setBuyAmount(e.target.value)}
            min="0"
          />
          <button 
            onClick={() => {
              onBuy(asset.symbol, parseFloat(buyAmount));
              setBuyAmount('');
            }}
            disabled={!buyAmount || parseFloat(buyAmount) <= 0}
          >
            Buy
          </button>
        </div>
        <div>
          <input
            type="number"
            placeholder="Amount to sell"
            value={sellAmount}
            onChange={(e) => setSellAmount(e.target.value)}
            min="0"
            max={asset.amount}
          />
          <button 
            onClick={() => {
              onSell(asset.symbol, parseFloat(sellAmount));
              setSellAmount('');
            }}
            disabled={!sellAmount || parseFloat(sellAmount) <= 0 || parseFloat(sellAmount) > asset.amount}
          >
            Sell
          </button>
        </div>
      </div>
    </div>
  );
};

export default CryptoCard;