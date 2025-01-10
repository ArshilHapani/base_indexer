import viemClient from '@/utils/viem';

async function watchEventOnContract() {
  viemClient.watchContractEvent({
    address: '0x4200000000000000000000000000000000000006',
    abi: require('@/abi/ERC20.json'),
    onLogs: (logs) => {
      logs.forEach((log) => {
        log.topics.forEach((topic) => {
          console.log(topic.toString());
        });
      });
    },
  });
}
