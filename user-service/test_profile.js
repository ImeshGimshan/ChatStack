const axios = require('axios');
async function run() {
  try {
    const res = await axios.get('http://localhost:5010/api/profile/search?username=imesh');
    console.log("Search Result:", res.data);
    if (res.data && res.data.length > 0) {
      const id = res.data[0].userId;
      console.log("Fetching profile for ID:", id);
      try {
        const pRes = await axios.get('http://localhost:5010/api/profile/' + id);
        console.log("Profile Result:", pRes.data);
      } catch (e) {
        console.log("Profile Fetch Error:", e.response ? e.response.status + " " + JSON.stringify(e.response.data) : e.message);
      }
    }
  } catch (e) {
    console.log("Search Error:", e.response ? e.response.status + " " + JSON.stringify(e.response.data) : e.message);
  }
}
run();
