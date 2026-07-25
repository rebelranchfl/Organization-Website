import {supabase} from './supabase-client.js';

const fail=(results)=>{const error=results.find(r=>r.error)?.error;if(error)throw error};

export async function loadSellerIdentity(){
  const {data:{session},error}=await supabase.auth.getSession();if(error)throw error;if(!session)return null;
  const user=session.user;
  const results=await Promise.all([
    supabase.from('profiles').select('display_name').eq('id',user.id).single(),
    supabase.from('user_roles').select('role').eq('user_id',user.id),
    supabase.from('seller_profiles').select('id,business_name,public_slug,marketplace_path,short_description,profile_status,region_id,owner_user_id').eq('owner_user_id',user.id).maybeSingle(),
    supabase.from('marketplace_categories').select('id,slug,name,description,path_group,parent_id,sort_order').eq('is_active',true).order('sort_order'),
    supabase.from('marketplace_regions').select('id,slug,region_name,state_code,region_type').eq('is_active',true).order('region_name'),
    supabase.from('creator_profiles').select('id,display_name,public_name,creator_type,age_band,profile_status,household_id').eq('owner_user_id',user.id).eq('profile_status','active').order('created_at'),
    supabase.from('households').select('id,household_name').eq('owner_user_id',user.id).limit(1).maybeSingle()
  ]);
  fail(results);
  const [profileR,rolesR,sellerR,categoriesR,regionsR,creatorsR,householdR]=results;
  const isAdmin=rolesR.data.some(r=>r.role==='admin');
  return {
    user,
    displayName:profileR.data.display_name,
    isAdmin,
    sellerProfile:sellerR.data,
    categories:categoriesR.data,
    regions:regionsR.data,
    creators:creatorsR.data,
    household:householdR.data
  };
}

export async function loadSellerWorkspace(identity){
  const spid=identity.sellerProfile.id, uid=identity.user.id;
  const results=await Promise.all([
    supabase.from('seller_applications').select('id,application_type,status,requested_categories,legal_business_name,entity_type,contact_phone,mailing_region_id,producer_status,applicant_notes,submitted_at,reviewed_at,reviewer_user_id,review_notes,created_at').eq('seller_profile_id',spid).order('created_at',{ascending:false}),
    supabase.from('seller_category_assignments').select('id,category_id,is_primary').eq('seller_profile_id',spid),
    supabase.from('seller_requirement_assignments').select('id,requirement_id,assignment_status,assigned_at,satisfied_at,waived_reason,compliance_requirements(id,code,title,description,requirement_type,requires_credential,requires_minor_consent)').eq('seller_profile_id',spid),
    supabase.from('seller_attestations').select('id,requirement_assignment_id,attestation_text,attested_at,is_current').eq('seller_profile_id',spid).eq('is_current',true),
    supabase.from('seller_credentials').select('id,requirement_assignment_id,credential_type,issuing_authority,credential_identifier,issued_at,expires_at,document_object_path,verification_status,verified_at').eq('seller_profile_id',spid).order('created_at',{ascending:false}),
    supabase.from('seller_review_events').select('id,subject_type,subject_id,from_status,to_status,note,recorded_at').eq('seller_profile_id',spid).order('recorded_at',{ascending:false}).limit(30),
    supabase.from('marketplace_notifications').select('id,notification_type,subject_type,subject_id,title,body,is_read,created_at').eq('owner_user_id',uid).order('created_at',{ascending:false}).limit(30),
    supabase.from('seller_creator_affiliations').select('id,creator_id,relationship_label,is_public,parent_approved_at').eq('seller_profile_id',spid),
    supabase.from('seller_household_affiliations').select('id,household_id,is_public').eq('seller_profile_id',spid)
  ]);
  fail(results);
  const [applications,categoryAssignments,requirementAssignments,attestations,credentials,reviewEvents,notifications,creatorAffiliations,householdAffiliations]=results;
  return {
    applications:applications.data,
    categoryAssignments:categoryAssignments.data,
    requirementAssignments:requirementAssignments.data,
    attestations:attestations.data,
    credentials:credentials.data,
    reviewEvents:reviewEvents.data,
    notifications:notifications.data,
    creatorAffiliations:creatorAffiliations.data,
    householdAffiliations:householdAffiliations.data
  };
}

export async function loadSellerAdminSummary(){
  const results=await Promise.all([
    supabase.from('seller_applications').select('id,seller_profile_id,application_type,status,legal_business_name,submitted_at,seller_profiles(business_name,marketplace_path)').eq('status','submitted').order('submitted_at'),
    supabase.from('seller_credentials').select('id,seller_profile_id,credential_type,verification_status,created_at,seller_profiles(business_name)').eq('verification_status','pending').order('created_at'),
    supabase.from('seller_requirement_assignments').select('id,seller_profile_id,requirement_id,assignment_status,assigned_at,compliance_requirements(title),seller_profiles(business_name)').eq('assignment_status','pending').order('assigned_at')
  ]);
  fail(results);
  const [applications,credentials,requirements]=results;
  return {applicationQueue:applications.data,credentialQueue:credentials.data,requirementQueue:requirements.data};
}

export async function loadApplicationDetail(sellerProfileId,applicationId){
  const results=await Promise.all([
    supabase.from('seller_applications').select('*').eq('id',applicationId).single(),
    supabase.from('seller_profiles').select('*').eq('id',sellerProfileId).single(),
    supabase.from('seller_category_assignments').select('id,category_id,is_primary,marketplace_categories(name,slug)').eq('seller_profile_id',sellerProfileId),
    supabase.from('seller_requirement_assignments').select('id,requirement_id,assignment_status,waived_reason,compliance_requirements(title,requirement_type)').eq('seller_profile_id',sellerProfileId),
    supabase.from('seller_attestations').select('id,requirement_assignment_id,attestation_text,attested_at').eq('seller_profile_id',sellerProfileId).eq('is_current',true),
    supabase.from('seller_credentials').select('*').eq('seller_profile_id',sellerProfileId),
    supabase.from('seller_review_events').select('*').eq('seller_profile_id',sellerProfileId).order('recorded_at',{ascending:false})
  ]);
  fail(results);
  const [application,sellerProfile,categories,requirements,attestations,credentials,events]=results;
  return {
    application:application.data,
    sellerProfile:sellerProfile.data,
    categories:categories.data,
    requirements:requirements.data,
    attestations:attestations.data,
    credentials:credentials.data,
    events:events.data
  };
}

export const actions={
  async createSellerProfile(identity,payload){
    const profile=await supabase.from('seller_profiles').insert({
      owner_user_id:identity.user.id,
      business_name:payload.business_name,
      marketplace_path:payload.marketplace_path,
      short_description:payload.short_description||null,
      region_id:payload.region_id||null,
      profile_status:'draft'
    }).select().single();
    if(profile.error)return profile;
    const spid=profile.data.id;
    if(payload.category_ids?.length){
      const rows=payload.category_ids.map(cid=>({seller_profile_id:spid,category_id:cid,is_primary:cid===payload.primary_category_id}));
      const cats=await supabase.from('seller_category_assignments').insert(rows);
      if(cats.error)return cats;
    }
    return supabase.from('seller_applications').insert({
      seller_profile_id:spid,
      application_type:'initial',
      status:'draft',
      legal_business_name:payload.legal_business_name||null,
      entity_type:payload.entity_type||null,
      contact_phone:payload.contact_phone||null,
      mailing_region_id:payload.region_id||null,
      producer_status:payload.producer_status||null,
      applicant_notes:payload.applicant_notes||null
    }).select().single();
  },
  async updateSellerProfile(identity,updates){
    return supabase.from('seller_profiles').update(updates).eq('id',identity.sellerProfile.id).eq('owner_user_id',identity.user.id);
  },
  async assignCategory(identity,categoryId,isPrimary=false){
    return supabase.from('seller_category_assignments').insert({seller_profile_id:identity.sellerProfile.id,category_id:categoryId,is_primary:isPrimary});
  },
  async removeCategory(identity,assignmentId){
    return supabase.from('seller_category_assignments').delete().eq('id',assignmentId);
  },
  async updateApplication(identity,applicationId,updates){
    return supabase.from('seller_applications').update(updates).eq('id',applicationId);
  },
  async submitApplication(identity,applicationId){
    return supabase.from('seller_applications').update({status:'submitted',submitted_at:new Date().toISOString()}).eq('id',applicationId);
  },
  async withdrawApplication(identity,applicationId){
    return supabase.from('seller_applications').update({status:'withdrawn'}).eq('id',applicationId);
  },
  async submitAttestation(identity,requirementAssignmentId,text){
    return supabase.from('seller_attestations').insert({seller_profile_id:identity.sellerProfile.id,requirement_assignment_id:requirementAssignmentId,attestation_text:text,attested_by:identity.user.id});
  },
  async uploadCredential(identity,file,fields){
    const safe=file.name.replace(/[^a-zA-Z0-9._-]/g,'-'),path=`${identity.user.id}/${identity.sellerProfile.id}/${crypto.randomUUID()}-${safe}`;
    const upload=await supabase.storage.from('marketplace-seller-private').upload(path,file);
    if(upload.error)return upload;
    return supabase.from('seller_credentials').insert({
      seller_profile_id:identity.sellerProfile.id,
      requirement_assignment_id:fields.requirement_assignment_id||null,
      credential_type:fields.credential_type,
      issuing_authority:fields.issuing_authority||null,
      credential_identifier:fields.credential_identifier||null,
      issued_at:fields.issued_at||null,
      expires_at:fields.expires_at||null,
      document_object_path:path
    });
  },
  async updateCredential(identity,credentialId,updates){
    return supabase.from('seller_credentials').update(updates).eq('id',credentialId);
  },
  async linkCreatorAffiliation(identity,creatorId,relationshipLabel){
    return supabase.from('seller_creator_affiliations').insert({seller_profile_id:identity.sellerProfile.id,creator_id:creatorId,relationship_label:relationshipLabel||null,is_public:false});
  },
  async setCreatorAffiliationPublic(identity,affiliationId,isPublic){
    return supabase.from('seller_creator_affiliations').update({is_public:isPublic}).eq('id',affiliationId);
  },
  async linkHouseholdAffiliation(identity,householdId){
    return supabase.from('seller_household_affiliations').insert({seller_profile_id:identity.sellerProfile.id,household_id:householdId,is_public:false});
  },
  async setHouseholdAffiliationPublic(identity,affiliationId,isPublic){
    return supabase.from('seller_household_affiliations').update({is_public:isPublic}).eq('id',affiliationId);
  },
  async markNotificationRead(identity,notificationId){
    return supabase.from('marketplace_notifications').update({is_read:true}).eq('id',notificationId);
  },
  async markAllNotificationsRead(identity,ids){
    if(!ids.length)return {error:null};
    return supabase.from('marketplace_notifications').update({is_read:true}).in('id',ids);
  },
  async signOut(){return supabase.auth.signOut()}
};

export const adminActions={
  async decideApplication(applicationId,status,reviewNotes){
    return supabase.from('seller_applications').update({status,review_notes:reviewNotes||null}).eq('id',applicationId);
  },
  async verifyCredential(credentialId){
    return supabase.from('seller_credentials').update({verification_status:'verified'}).eq('id',credentialId);
  },
  async rejectCredential(credentialId){
    return supabase.from('seller_credentials').update({verification_status:'rejected'}).eq('id',credentialId);
  },
  async waiveRequirement(assignmentId,reason){
    return supabase.from('seller_requirement_assignments').update({assignment_status:'waived',waived_reason:reason}).eq('id',assignmentId);
  },
  async markNotApplicable(assignmentId,reason){
    return supabase.from('seller_requirement_assignments').update({assignment_status:'not_applicable',waived_reason:reason}).eq('id',assignmentId);
  },
  async markSatisfied(assignmentId){
    return supabase.from('seller_requirement_assignments').update({assignment_status:'satisfied',satisfied_at:new Date().toISOString()}).eq('id',assignmentId);
  },
  async getDocumentUrl(path){
    return supabase.storage.from('marketplace-seller-private').createSignedUrl(path,300);
  }
};
