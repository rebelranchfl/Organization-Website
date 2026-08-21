import { supabase } from './supabase-client.js';

let busy=false;
const REC_LABEL={PURSUE_NOW:'Pursue Now',PURSUE_LATER:'Pursue Later',INCORPORATE_BUNDLE:'Bundle / Incorporate',FREE_RESOURCE:'Free Resource',MONITOR:'Monitor',NOT_RECOMMENDED_OWNER_REVIEW:'Owner Review — Not Recommended'};
// Draft preserved before semantic-node correction. Full draft is available at Git commit de7753435aa9b81df889cb3fded8895a7418d7a7.
