// AI-Agent: ChatGPT/Codex
// Session: Rebel Ranch Local order system
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const cors={
  'Access-Control-Allow-Origin':'https://rebelranchministries.org',
  'Access-Control-Allow-Headers':'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods':'POST, OPTIONS'
};
const json=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers:{...cors,'Content-Type':'application/json'}});
const clean=(value:unknown,max=2000)=>String(value??'').trim().slice(0,max);
const dashboardUrl='https://rebelranchministries.org/marketplace-seller-dashboard.html#orders';

async function notifySeller(admin:any,ownerUserId:string,orderNumber:string){
  const tasks:Promise<unknown>[]=[];
  const resendKey=Deno.env.get('RESEND_API_KEY');
  if(resendKey){
    tasks.push((async()=>{
      const {data,error}=await admin.auth.admin.getUserById(ownerUserId);
      if(error)throw error;
      const email=data.user?.email;
      if(!email)return;
      const response=await fetch('https://api.resend.com/emails',{
        method:'POST',
        headers:{Authorization:`Bearer ${resendKey}`,'Content-Type':'application/json'},
        body:JSON.stringify({
          from:'Rebel Ranch Local <noreply@rebelranchministries.org>',
          to:[email],
          subject:`New Rebel Ranch Local order ${orderNumber}`,
          html:`<p>You received a new Rebel Ranch Local order.</p><p><strong>Order ${orderNumber}</strong></p><p><a href="${dashboardUrl}">Sign in to review and respond</a></p><p>Customer and order details remain private inside your seller dashboard.</p>`
        })
      });
      if(!response.ok)throw new Error(`Resend notification failed: ${response.status} ${await response.text()}`);
    })());
  }
  const oneSignalAppId='3d048078-bf37-42ff-a1b7-3c1994cc62af';
  const oneSignalKey=Deno.env.get('ONESIGNAL_REST_API_KEY');
  if(oneSignalKey){
    tasks.push((async()=>{
      const response=await fetch('https://api.onesignal.com/notifications',{
        method:'POST',
        headers:{Authorization:`Key ${oneSignalKey}`,'Content-Type':'application/json'},
        body:JSON.stringify({
          app_id:oneSignalAppId,
          include_aliases:{external_id:[ownerUserId]},
          target_channel:'push',
          headings:{en:'New Rebel Ranch Local order'},
          contents:{en:`Order ${orderNumber} is ready for review.`},
          url:dashboardUrl
        })
      });
      if(!response.ok)throw new Error(`OneSignal notification failed: ${response.status} ${await response.text()}`);
    })());
  }
  const results=await Promise.allSettled(tasks);
  results.forEach(result=>{if(result.status==='rejected')console.error(result.reason)});
}

Deno.serve(async(req)=>{
  if(req.method==='OPTIONS')return new Response('ok',{headers:cors});
  if(req.method!=='POST')return json({error:'Method not allowed'},405);
  try{
    const form=await req.formData();
    const payload=JSON.parse(clean(form.get('payload'),50000));
    const sellerId=clean(payload.seller_profile_id,36);
    const buyerName=clean(payload.buyer_name,120),buyerContact=clean(payload.buyer_contact,240);
    const kind=payload.order_kind==='service_request'?'service_request':'product_order';
    const fulfillment=clean(payload.fulfillment_method,32);
    if(!sellerId||!buyerName||!buyerContact)return json({error:'Name, contact, and seller are required.'},400);
    if(!['pickup','delivery','meetup','shipping','seller_coordination'].includes(fulfillment))return json({error:'Choose a valid fulfillment option.'},400);
    if(!Array.isArray(payload.items)||payload.items.length<1||payload.items.length>50)return json({error:'Add at least one item.'},400);

    const admin=createClient(Deno.env.get('SUPABASE_URL')!,Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,{auth:{persistSession:false}});
    const {data:seller}=await admin.from('seller_profiles').select('id,owner_user_id,profile_status,public_slug').eq('id',sellerId).eq('profile_status','active').not('public_slug','is',null).maybeSingle();
    if(!seller)return json({error:'This seller is not currently accepting marketplace orders.'},404);
    const listingIds=payload.items.map((x:any)=>clean(x.listing_id,36));
    const {data:listings,error:listError}=await admin.from('seller_listings').select('id,listing_type,title,price_label,unit_price,price_type').eq('seller_profile_id',sellerId).eq('is_active',true).in('id',listingIds);
    if(listError||!listings||listings.length!==new Set(listingIds).size)return json({error:'One or more selected listings are unavailable.'},400);
    const byId=new Map(listings.map(x=>[x.id,x]));
    const items=payload.items.map((raw:any)=>{
      const source:any=byId.get(clean(raw.listing_id,36));
      const quantity=Math.max(1,Math.min(99,Number.parseInt(raw.quantity,10)||1));
      return {listing_id:source.id,title:source.title,listing_type:source.listing_type,quantity,note:clean(raw.note,500),price_label:source.price_label,unit_price:source.unit_price,price_type:source.price_type};
    });
    const fixed=items.every((x:any)=>x.price_type==='fixed'&&x.unit_price!==null);
    const estimatedTotal=fixed?items.reduce((sum:number,x:any)=>sum+Number(x.unit_price)*x.quantity,0):null;
    const orderId=crypto.randomUUID();
    const file=form.get('photo'); let photoPath:string|null=null;
    if(file instanceof File&&file.size){
      if(file.size>5242880||!['image/jpeg','image/png','image/webp'].includes(file.type))return json({error:'Photo must be a JPEG, PNG, or WebP image no larger than 5 MB.'},400);
      const ext=file.type==='image/png'?'png':file.type==='image/webp'?'webp':'jpg';
      photoPath=`${sellerId}/${orderId}/buyer-photo.${ext}`;
      const upload=await admin.storage.from('marketplace-order-private').upload(photoPath,file,{contentType:file.type,upsert:false});
      if(upload.error)return json({error:'The photo could not be uploaded.'},500);
    }
    const auth=clean(req.headers.get('Authorization'),4096).replace(/^Bearer\s+/i,'');
    let buyerUserId:null|string=null;
    if(auth){const {data}=await admin.auth.getUser(auth);buyerUserId=data.user?.id||null;}
    const {data:order,error}=await admin.from('seller_orders').insert({
      id:orderId,seller_profile_id:sellerId,buyer_user_id:buyerUserId,buyer_name:buyerName,buyer_contact:buyerContact,
      order_kind:kind,items,fulfillment_method:fulfillment,preferred_date:clean(payload.preferred_date,160)||null,
      delivery_address:fulfillment==='delivery'?clean(payload.delivery_address,500)||null:null,buyer_note:clean(payload.buyer_note,2000)||null,
      service_location:kind==='service_request'?clean(payload.service_location,500)||null:null,
      photo_object_paths:photoPath?[photoPath]:[],estimated_total:estimatedTotal
    }).select('order_number').single();
    if(error){if(photoPath)await admin.storage.from('marketplace-order-private').remove([photoPath]);throw error;}
    await notifySeller(admin,seller.owner_user_id,order.order_number);
    return json({order_number:order.order_number});
  }catch(error){console.error(error);return json({error:'The order could not be sent. Please try again.'},500);}
});
