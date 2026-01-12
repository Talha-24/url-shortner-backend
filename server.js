import express from "express";
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";
dotenv.config();
const app = express();
const supabase = createClient(
  process.env.SUPABASE_PROJECT_URL,
  process.env.SUPABASE_SERVICE_KEY
);
app.use(express.json());
app.get("/short-url", async (req, res) => {
  const { longUrl } = req.query;
  // Storing to DB
  const { data: storedLongUrl, error } = await supabase
    .from("original_urls")
    .insert({ long_url: longUrl })
    .select("id")
    .maybeSingle();

  if (storedLongUrl) {
    // Hash Function, converting to short url

    function urlShortener(longUrl) {
      //
      let alphaNumericUrl = "";

      //   Removing Slashes
      for (let character of longUrl) {
        if (character != "/") {
          alphaNumericUrl += character;
        }
      }

      // Remove https
      if (alphaNumericUrl.includes("https")) {
        alphaNumericUrl = alphaNumericUrl.slice(6);
      } else if (alphaNumericUrl.includes("http")) {
        alphaNumericUrl = alphaNumericUrl.slice(4);
      }

      return (
        process.env.BASE_URL +
        "/" +
        alphaNumericUrl.substring(0, 2) +
        alphaNumericUrl.substring(
          alphaNumericUrl.length / 2 + alphaNumericUrl.length / 2 + 2
        ) +
        alphaNumericUrl.substring(
          alphaNumericUrl.length - 4,
          alphaNumericUrl.length + 5
        )
      );
    }

    const shortUrl = urlShortener(longUrl);

    // STORING SHORT URL
    const { data, error } = await supabase
      .from("shortened_urls")
      .insert({ long_url_id: storedLongUrl.id, short_url: shortUrl });

    if (!error) {
      return res.json({ short_url: shortUrl });
    } else {
      return res.json({ message: error.message });
    }
  } else {
    return res.json({ message: error.message });
  }
});

app.get("/:short_url", async (req, res) => {
  const { short_url } = req.params;

  const filteredShortUrl = process.env.BASE_URL + "/" + short_url;

  if (filteredShortUrl && short_url) {
    const { data } = await supabase
      .from("shortened_urls")
      .select("long_url_id")
      .eq("short_url", filteredShortUrl)
      .maybeSingle();

    if (data) {
      const { data: longUrl } = await supabase
        .from("original_urls")
        .select("long_url")
        .eq("id", data.long_url_id)
        .maybeSingle();
      if (longUrl) {
        return res.redirect(longUrl.long_url);
      }
    }
  }

  // Searching for corresponding long url
});

app.listen(4242, () => {
  console.log("Server is runnning on port 4242");
});
