import { getTokenPriceViem } from './src/utils/helpers';

(async function () {
  const price = await getTokenPriceViem(
    '0xd2c5bE4c86150E60f49c791664424DE0f2285c55'
  );
  console.log(price);
})();
