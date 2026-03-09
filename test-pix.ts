const fetchPix = async () => {
    try {
        const res = await fetch("https://nyxysqxqayhsxnqqoazd.supabase.co/functions/v1/vox-payments", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ plan_slug: "pro", user_id: "cfca7682-795d-49df-85bb-a59aa34ecbfd", method: "pix" })
        });
        const text = await res.text();
        console.log("Status:", res.status);
        console.log("Body:", text);
    } catch (e) {
        console.error(e);
    }
}
fetchPix();
