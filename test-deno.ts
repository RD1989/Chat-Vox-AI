const url = "https://nyxysqxqayhsxnqqoazd.supabase.co/functions/v1/vox-payments";

async function run() {
    console.log("Calling", url);
    const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            plan_slug: "pro",
            user_id: "cfca7682-795d-49df-85bb-a59aa34ecbfd",
            method: "pix"
        })
    });
    console.log("Status:", res.status);
    console.log("Body:", await res.text());
}

run();
