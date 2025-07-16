setInterval(() => {
  fetch("https://games-online-service.onrender.com")
    .then(() => console.info("wake up bro"))
    .catch((e) => console.error("keep alive err: ", e));
}, 600000);
