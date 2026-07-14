window.RebelRanchPayments = {
  async startCheckout(supabase, offerCode) {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      window.location.href = "account.html?returnTo=creation-station-membership.html";
      return;
    }

    const storageKey = `paypal-checkout-request:${offerCode}`;
    let requestId = sessionStorage.getItem(storageKey);
    if (!requestId) {
      requestId = crypto.randomUUID();
      sessionStorage.setItem(storageKey, requestId);
    }

    const response = await fetch(
      "https://dfrwxpuojeiykaignyny.supabase.co/functions/v1/paypal-create-subscription",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ offer_code: offerCode, request_id: requestId }),
      },
    );
    const result = await response.json();
    if (!response.ok || !result.approve_url) {
      if (response.status >= 400 && response.status < 500 && response.status !== 408) {
        sessionStorage.removeItem(storageKey);
      }
      throw new Error(result.error || "Checkout could not be started.");
    }
    window.location.assign(result.approve_url);
  },

  clearCheckoutAttempts() {
    for (const key of Object.keys(sessionStorage)) {
      if (key.startsWith("paypal-checkout-request:")) sessionStorage.removeItem(key);
    }
  },
};
