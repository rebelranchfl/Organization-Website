window.RebelRanchPayments = {
  async startCheckout(supabase, offerCode) {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      window.location.href = "login.html?returnTo=creation-station-membership.html";
      return;
    }
    const response = await fetch(
      "https://dfrwxpuojeiykaignyny.supabase.co/functions/v1/paypal-create-subscription",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ offer_code: offerCode }),
      },
    );
    const result = await response.json();
    if (!response.ok || !result.approve_url) throw new Error(result.error || "Checkout could not be started.");
    window.location.href = result.approve_url;
  },
};
