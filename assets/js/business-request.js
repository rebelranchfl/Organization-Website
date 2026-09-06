(() => {
  const services = {
    'general-business-service': {
      name: 'I\'ve Got the Potential',
      price: 'You will be contacted within 24 hours',
      description: 'I just don\'t know how to get there. Tell us what is happening now and what you want to build, change, or accomplish so we can identify the right starting point.'
    },
    'owner-capacity-recovery': {
      name: 'Get Your Time Back',
      price: 'Starting at $199 · Normally $249',
      description: 'Owner Capacity Recovery for sole operators carrying every role in the business.'
    },
    'lead-capture-follow-up': {
      name: 'Stop Losing Customers',
      price: 'Starting at $199 · Normally $349',
      description: 'Lead Capture and Customer Follow-Up that protects opportunities during a busy workday.'
    },
    'money-leaks': {
      name: 'Keep Your Money',
      price: 'Starting at $199 · Normally $449',
      description: 'You do quality work. Money comes in. Too little of it stays. We follow every dollar across the whole operation, find root causes, and build one clean flow so costs and financial results are easier to see.'
    },
    'online-presence': {
      name: 'Get Seen, Get Found',
      price: 'Starting at $199 · Normally $649',
      description: 'Online Presence and Social Media improvements that help local customers find, understand, and contact the business.'
    },
    'revenue-cycle': {
      name: 'Automated Payment Processing',
      price: 'Starting at $199 · Normally $449',
      description: 'Design, setup, connection, automation, and streamlining for the merchant services, payment systems, and software that move money through your business.'
    },
    'ongoing-business-guidance': {
      name: 'Add an Operations Leader to Your Team',
      price: '$299 per month',
      description: 'Ongoing access to operations strategy, operations management, and process engineering support without adding a full-time employee.'
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

