export function createWsHub(wss) {
  function broadcast(obj) {
    const msg = JSON.stringify(obj);
    for (const client of wss.clients) {
      if (client.readyState === 1) client.send(msg);
    }
  }

  return { broadcast };
}

