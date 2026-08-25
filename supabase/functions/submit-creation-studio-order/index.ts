// AI-Agent: ChatGPT/GPT-5.6 Sol
// Session: Creation Station Studio Publishing and Orders
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const cors={
  'Access-Control-Allow-Origin':'https://rebelranchministries.org',
  'Access-Control-Allow-Headers':'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods':'POST, OPTIONS'
};
const json=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers:{...cors,'Content-Type':'application/json'}});
const clean=(value:unknown,max=2000)=>String(value??'').trim().slice(0,max);
const dashboardUrl='https://rebelranchministries.org/creation-station-orders.html';
const fulfillmentMap:Record<string,string>={shipped:'shipping',mailed:'shipping',pickup_customer:'pickup',dropoff_seller:'delivery',local_meet:'meetup'};

function parsePrice(label:unknown){
  const match=clean(label,80).replace(/,/g,'').match(/^\$?\s*(\d+(?:\.\d{1,2})?)\s*$/);
  return match?Number(match[1]):null;
}

async function notifyOwner(admin:any,ownerUserId:string,orderNumber:string,brandName:string){
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
          from:'Creation Station <noreply@rebelranchministries.org>',
          to:[email],
          subject:`New Creation Station Studio order ${orderNumber}`,
          html:`<p>You received a new order request for <strong>${brandName.replace(/[<>&"']/g,'')}</strong>.</p><p><strong>Order ${orderNumber}</strong></p><p><a href="${dashboardUrl}">Sign in to review and respond</a></p><p>Buyer and order details remain private inside the authenticated Creation Station order inbox.</p>`
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
          headings:{en:'New Creation Station Studio order'},
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
    const payload=await req.json();
    const requestId=clean(payload.website_request_id,36);
    const buyerName=clean(payload.buyer_name,120);
    const buyerContact=clean(payload.buyer_contact,240);
    const fulfillment=clean(payload.fulfillment_method,32);
    if(!requestId||!buyerName||!buyerContact)return json({error:'Name, contact, and Studio are required.'},400);
    if(!Array.isArray(payload.items)||payload.items.length<1||payload.items.length>50)return json({error:'Add at least one item.'},400);

    const admin=createClient(Deno.env.get('SUPABASE_URL')!,Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,{auth:{persistSession:false}});
    const {data:studio,error:studioError}=await admin.from('creator_website_requests')
      .select('id,owner_user_id,status,public_slug,brand_name,delivery_methods,parent_approver_name,parent_approver_relationship,parent_approved_at,consent_statement')
      .eq('id',requestId).in('status',['approved','published']).not('public_slug','is',null).maybeSingle();
    if(studioError||!studio)return json({error:'This Studio is not currently accepting orders.'},404);
    if(!clean(studio.parent_approver_name,120)||!clean(studio.parent_approver_relationship,60)||!studio.parent_approved_at||!clean(studio.consent_statement,2000))return json({error:'This Studio is not currently accepting orders.'},404);

    const {data:membership}=await admin.from('memberships').select('id').eq('user_id',studio.owner_user_id).eq('program_code','creation_station')
      .in('offer_code',['creator_website','club_all_access_bundle']).in('membership_status',['active','past_due'])
      .or(`starts_at.is.null,starts_at.lte.${new Date().toISOString()}`).or(`ends_at.is.null,ends_at.gt.${new Date().toISOString()}`).limit(1).maybeSingle();
    if(!membership)return json({error:'This Studio is not currently accepting orders.'},404);

    const allowedFulfillment=new Set((studio.delivery_methods||[]).map((x:string)=>fulfillmentMap[x]).filter(Boolean));
    if(!allowedFulfillment.size)allowedFulfillment.add('seller_coordination');
    if(!allowedFulfillment.has(fulfillment))return json({error:'Choose a fulfillment option offered by this Studio.'},400);

    const productIds=payload.items.map((x:any)=>clean(x.product_id,36));
    if(productIds.some((x:string)=>!x)||new Set(productIds).size!==productIds.length)return json({error:'One or more selected products are invalid.'},400);
    const {data:products,error:productError}=await admin.from('creator_studio_products').select('id,title,price_label').eq('website_request_id',requestId).eq('is_active',true).in('id',productIds);
    if(productError||!products||products.length!==productIds.length)return json({error:'One or more selected products are unavailable.'},400);
    const byId=new Map(products.map((x:any)=>[x.id,x]));
    const items=payload.items.map((raw:any)=>{
      const source:any=byId.get(clean(raw.product_id,36));
      const quantity=Math.max(1,Math.min(99,Number.parseInt(raw.quantity,10)||1));
      const unitPrice=parsePrice(source.price_label);
      return {product_id:source.id,title:source.title,quantity,note:clean(raw.note,500),price_label:source.price_label,unit_price:unitPrice};
    });
    const hasFixedPrices=items.every((x:any)=>x.unit_price!==null);
    const estimatedTotal=hasFixedPrices?items.reduce((sum:number,x:any)=>sum+Number(x.unit_price)*x.quantity,0):null;
    const cartSummary=items.map((x:any)=>`${x.quantity}x ${x.title}${x.price_label?` (${x.price_label})`:''}`).join(', ');

    const auth=clean(req.headers.get('Authorization'),4096).replace(/^Bearer\s+/i,'');
    let senderUserId:null|string=null;
    if(auth){const {data}=await admin.auth.getUser(auth);senderUserId=data.user?.id||null;}

    const {data:order,error}=await admin.from('studio_order_requests').insert({
      website_request_id:requestId,
      sender_user_id:senderUserId,
      sender_name:buyerName,
      sender_contact:buyerContact,
      cart_summary:cartSummary,
      message:clean(payload.buyer_note,2000)||null,
      order_kind:'product_order',
      items,
      fulfillment_method:fulfillment,
      preferred_date:clean(payload.preferred_date,160)||null,
      delivery_address:fulfillment==='delivery'?clean(payload.delivery_address,500)||null:null,
      buyer_note:clean(payload.buyer_note,2000)||null,
      estimated_total:estimatedTotal,
      status:'new'
    }).select('order_number').single();
    if(error)throw error;

    await notifyOwner(admin,studio.owner_user_id,String(order.order_number),clean(studio.brand_name,120));
    return json({order_number:order.order_number});
  }catch(error){
    console.error(error);
    return json({error:'The order could not be sent. Please try again.'},500);
  }
});
