function getRequestURL(coinCode)
{
  return "https://api.cryptonator.com/api/ticker/" + coinCode + "-USD";
}

/*function getCoinPrice(coinCode)
{
  // gather coin price by using cryptonator api
  var text = "https://api.cryptonator.com/api/ticker/" + coinCode + "-USD");

  $.ajax({
    datatype: "json",
    url: text,
    context: document.body,
    success: function(data)
    {
      var coin = JSON.parse(data);
    }
  });
}*/

// function purchaseCoin(numOfShares, coinCode)
// {
//   var purchasePrice = numOfShares * getCoinPrice(coinCode);
//   if(purchasePrice < user.liquidAssets)
//   {
//     //error
//   }
//   else
//   {
//     user.liquidAssets -= purchasePrice;
//     if(isOwned(coinCode))
//     {
//       for(int i = 0; i < user.assets.length; i++)
//       {
//         if(user.assets[i].tag == coinCode)
//         {
//           user.assets[i].quantity += numOfShares;
//           break;
//         }
//       }
//     }
//     else
//     {
//       //error
//     }
//   }
// }

function purchaseCoin(numOfShares, coinCode)
{
  $.ajax({
      url: '/api/liquidAssets',
      type: "GET",
      context: document.body,
      success: function(data)
      {
        $.ajax({
          datatype: "json",
          url: getRequestURL(coinCode),
          context: document.body,
          success: function(data2)
          {
            var coin = JSON.parse(data2);
            if(data.liquidAssets < (coin.price * numOfShares))
            {
              //error not enough money
            }
            else
            {
              $.ajax({
                url: '/api/assets', //assets
                context: document.body,
                success: function(data3)
                {
                  if(!isOwned(coinCode))
                  {
                      var newAsset = { name : data2.name, tag: coinCode, price: data2.price, quantity: numOfShares};
                      data3.push(newAsset);
                      $.ajax({
                        url: '/api/assets', //push to assets
                        type: "POST",
                        data: data3,
                        success: function(){}
                      });
                  }
                  else
                  {
                    for(var i = 0; i < data3.length; i++)
                    {
                      if(data3.tag == coinCode)
                      {
                        data3.quantity += numOfShares;
                      }
                    }
                  }
                  var transRec = {name: data2.name, tag: data2.tag, price: data2.price, quantity: numOfShares, buy: true};
                  $.ajax({
                    url: '/api/transactions',
                    type: "POST",
                    data: transRec,
                    success: function(){}
                  });
                }
              });
            }
          }
        });
      }

  });
}

/*
function sellCoin(numOfShares, coinCode)
{
  if(!isOwned(coinCode))
  {
    //error no coins of that type owned.
  }
  coinPrice = getCoinPrice(coinCode);
  for(int i = 0, i < user.assets.length; i++)
  {
    if(user.assets[i].tag == coinCode) //ensure user owns coins of that type.
    {
      if(user.assets[i].quantity < numOfShares)
      {
        //error not enough shares to sell
      }
      else
      {
        user.assets[i].quantity -= numOfShares;
        user.liquidAssets += (coinPrice * numOfShares);
      }
    }
  }
}*/

/*function getNetWorth()
{
  var coinNetWorth;
  for(int i = 0; i < user.assets.length, i++)
  {
    coinNetWorth += getCoinPrice(user.assets[i].tag) * user.assets[i].quantity;
  }

  return user.liquidAssets + coinNetWorth;
}*/

function isOwned(coinCode)
{
  var isOwnedBool = false;
  $.ajax({
    url: '/api/assets',
    context: document.body,
    success: function(data)
    {
      for(var i = 0; i < data.assets.length; i++)
      {
        if(data.assets[i].tag == coinCode && data.assets[i].quantity > 0)
        {
          isOwnedBool = true;
          break;
        }
      }
    }
  });
  return isOwnedBool;
}
