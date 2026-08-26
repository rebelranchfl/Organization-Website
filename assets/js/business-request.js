(() => {
  const services = {
    'general-business-service': {
      name: 'Tell Us What Your Business Needs',
      price: 'You will be contacted within 24 hours',
      description: 'Rebel Ranch and 3P Help Me partnered to deliver these donated professional services to support local businesses. This ensures that local businesses receive the guidance and support they need at a price they can afford.'
    },
    'owner-capacity-recovery': {
      name: 'Give Me Back My Time',
      price: 'Starting at $199 · Normally $249',
      description: 'Owner Capacity Recovery for sole operators carrying every role in the business.'
    },
    'lead-capture-follow-up': {
      name: 'Stop Losing Customers While You Are Busy Doing the Work',
      price: 'Starting at $199 · Normally $349',
      description: 'Lead Capture and Customer Follow-Up that protects opportunities during a busy workday.'
    },
    'money-leaks': {
      name: 'Fixing Money Leaks',
      price: 'Starting at $199 · Normally $449',
      description: 'Resources, Processes, and Streamlining to reduce wasted time, effort, and operating costs.'
    },
    'online-presence': {
      name: 'Get Seen, Get Found',
      price: 'Starting at $199 · Normally $649',
      description: 'Online Presence and Social Media improvements that help local customers find, understand, and contact the business.'
    },
    'revenue-cycle': {
      name: 'Turn Finished Work Into Money in the Bank',
      price: 'Starting at $199 · Normally $449',
      description: 'Payment Processing and Revenue Cycle improvements that reduce delays between completed work and usable cash.'
    },
    'ongoing-business-guidance': {
      name: 'Ongoing Business Strategy & Operational Guidance',
      price: '$299 per month',
      description: 'Continued business-specific planning, problem-solving, and decision support throughout the month.'
    },
    'get-paid-faster': {
      name: 'Get Paid Faster — Set Up Your Payment Links',
      price: '$49.99 flat',
      description: 'We help you set up PayPal, Stripe, Zelle, or another payment method and add it to your Rebel Ranch Local seller listing, so buyers can pay you right away instead of waiting on cash or a check.'
    }
  };

  const params = new URLSearchParams(window.location.search);
  const requestedSlug = params.get('service');
  const selectedSlug = Object.hasOwn(services, requestedSlug) ? requestedSlug : 'general-business-service';
  const select = document.getElementById('service-select');
  const title = document.getElementById('request-title');
  const description = document.getElementById('service-description');
  const price = document.getElementById('service-price');
  const slugField = document.getElementById('service-slug');
  const serviceField = document.getElementById('service-requested');
  const priceField = document.getElementById('service-price-field');
  const referralField = document.getElementById('referral-source');
  if (referralField) referralField.value = params.get('ref') || 'direct';
  const contactMethod = document.getElementById('contact-method');
  const phone = document.getElementById('phone');
  const phoneRequiredNote = document.getElementById('phone-required-note');
  const textConsentRow = document.getElementById('text-consent-row');
  const textConsent = document.getElementById('text-consent');

  Object.entries(services).forEach(([slug, service]) => {
    const option = document.createElement('option');
    option.value = slug;
    option.textContent = `${service.name} — ${service.price}`;
    select.append(option);
  });

  const showService = slug => {
    const service = services[slug];
    title.textContent = service.name;
    description.textContent = service.description;
    price.textContent = service.price;
    slugField.value = slug;
    serviceField.value = service.name;
    priceField.value = service.price;
    select.value = slug;
    document.title = `${service.name} | Rebel Ranch Ministries`;
  };

  select.addEventListener('change', () => showService(select.value));
  showService(selectedSlug);

  const updateContactFields = () => {
    const texting = contactMethod.value === 'Text message';
    const needsPhone = texting || contactMethod.value === 'Phone call';
    phone.required = needsPhone;
    phoneRequiredNote.hidden = !needsPhone;
    textConsentRow.hidden = !texting;
    textConsent.required = texting;
    if (!texting) textConsent.checked = false;
  };

  contactMethod.addEventListener('change', updateContactFields);
  updateContactFields();

  const form = document.getElementById('business-request-form');
  const status = document.getElementById('form-status');

  form.addEventListener('submit', async event => {
    event.preventDefault();
    const submit = form.querySelector('button[type="submit"]');
    const originalText = submit.textContent;
    submit.disabled = true;
    submit.textContent = 'Sending Request...';
    status.textContent = '';

    try {
      const response = await fetch(form.action, {
        method: 'POST',
        body: new FormData(form),
        headers: { Accept: 'application/json' }
      });

      if (!response.ok) throw new Error('Request failed');

      form.reset();
      showService(selectedSlug);
      updateContactFields();
      status.textContent = 'Your request was received. Rebel Ranch Ministries will review it and respond within 24 business hours to confirm the service and send the secure invoice and intake instructions.';
    } catch (error) {
      status.textContent = 'The request did not send. Please try again or email rebelranchfl@gmail.com.';
    } finally {
      submit.disabled = false;
      submit.textContent = originalText;
    }
  });
})();

