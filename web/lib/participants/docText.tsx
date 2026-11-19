// The fixed wording on the Privacy Consent Form and Emergency Plan, as in Bubble.
// Each block is [heading, paragraph text]; the heading may be empty.
export type Block = [string, string];

export const CONSENT_INTRO: Block[] = [
  ["", "As an NDIS participant in our service, Knightingale, we need your consent to collect, store, and use your personal information to effectively deliver services. Please review this form carefully along with the Service Agreement, and sign it if you agree to the stated terms."],
  ["1. Protection of Your Sensitive Information", "We respect your privacy and dignity. Thus, we only collect sensitive information like health, medical, and disability-related information when it's needed for service provision and only if:\na. You provide explicit consent, or\nb. We're legally required to do so."],
  ["2. Your Consent", "Before you give consent, our carers will explain how we will use your data and who it may be disclosed to. They will ensure you understand everything clearly, providing assistance such as interpreter services or legal aid, as necessary. Your consent can be changed or updated at any time."],
  ["3. Informing You about Your Information", "We will regularly inform you about how your information is used and stored. You have a right to access, correct your data, or lodge a complaint. Should you prefer, we encourage you to be involved in this process along with family, friends and/or your chosen community."],
  ["4. Information Collected", "We may collect the following personal information: Your personal details, identifiers, service details, medical information, financial information, and interaction records. We may collect recorded material such as audio/visual formats."],
  ["5. How We Collect Information", "We may gather your information from our website, your correspondence with us, forms filled by you, face-to-face interactions, events, third-party referrals, or government agencies."],
  ["6. Purpose of Information Collection", "We use this information to customise your support plans, answer inquiries, manage and improve our services, adhere to legal obligations, inform you about our activities, perform research, and improve your website experience."],
  ["7. Third-Party Disclosures", "We may disclose your personal information without your consent in certain circumstances. This includes situations where there is an immediate risk of harm to you or others, or if required or authorised by law. Additionally we may share your personal information with organisations such as the NDIS Commission, funding providers, external auditors, regulatory bodies, law enforcement, courts, financial institutions, or external service providers, as necessary for service provision, legal compliance, or based on your authorisation."],
  ["8. Access to Your Personal Information and Complaints", "The Knightingale Privacy and Information Management Policy includes information about how you can access your personal information we hold, and how to make a complaint about a breach of your privacy or the Privacy Act, which will be dealt in accordance with our Feedback and Complaints Policy."],
  ["9. Handling of Privacy Breaches", "Any breach or alleged breach of your privacy will be taken seriously. Such incidents will be reported and managed as per our Incident Management Policy."],
  ["10. Contacting Us", "For questions, concerns, or to request a copy of our Privacy and Information Management Policy, Feedback and Complaints Policy, or Incident Management Policy, please contact us at +61 426 512 584 or paul@knightingale.com.au."],
  ["", "If you would like to adjust your consent regarding specific uses of your personal information by Knightingale, kindly indicate your preferences by checking the corresponding boxes below."],
];

export const consentOutro = (name: string): Block[] => [
  ["13. Future Withdrawal or Amendment of Consent", "Please remember that your consent continues until you provide us with instructions to the contrary. You can withdraw or amend your consent to Knightingale using your personal information at any time by texting or emailing Knightingale."],
  ["14. Consent by Representative (if applicable)", `If you are providing consent on behalf of the participant, please sign the representative section below:\n\nI, the undersigned, confirm that I am authorised to act on behalf of ${name}.\n\nI have read Knightingale's Privacy and Information Management Policy and Incident Management Policy. I provide consent on behalf of the aforementioned Participant for the use of his/her personal information for the purposes set out and in accordance with the preferences set out above.\n\nI also consent to my personal information being used to administer this consent and to provide evidence of this consent to third parties as necessary.`],
  ["15. Confirmation of Consent", "As the participant, you agree by signing below, that you understand and agree to the use of your personal information as outlined above by Knightingale."],
];

export const EVACUATION_KIT: Block[] = [
  ["Emergency Evacuation Kit", "An emergency evacuation kit is essential in any emergency situation. Knightingale carers will encourage you to prepare an Evacuation kit and it should be kept in an easily accessible location known to you and all your carers. We've provided some helpful tips below on how to prepare a kit:"],
  ["1. Container", "Choose a durable and waterproof container for storing your emergency evacuation kit. It should be easy to carry and large enough to hold all necessary items."],
  ["2. Food and Water", "Include at least a three-day supply of non-perishable food items and water. Consider any dietary restrictions the participant may have."],
  ["3. Medications and Medical Supplies", "Pack a seven-day supply of necessary medications and other medical supplies. Do not forget to include a first aid kit. Always check the expiry dates and replace as needed."],
  ["4. Personal Care Items", "Include essential items such as spare glasses, hearing aid batteries, toiletries, sanitation supplies, and any other personal care items you may need."],
  ["5. Documents", "Keep a set of copies of important documents in the kit. These might include identification, insurance cards, medical records, and a copy of the individualised emergency plan."],
  ["6. Comfort Items", "Add items that might provide comfort during a stressful situation, such as a favourite book, a set of warm clothing, or a blanket."],
  ["7. Communication and Lighting", "Pack spare batteries, a flashlight and a power bank. A whistle can also be useful for signalling help."],
  ["8. Special Needs Items", "Consider the participant's unique needs. This might include wheelchair batteries, oxygen, catheters, or other specialised equipment or supplies."],
  ["9. Cash and Keys", "Include a small amount of cash and coins, and an extra set of keys to your home and vehicle."],
  ["", "Check and update your emergency evacuation kit regularly (at least once per year). Replace expired items and update the kit according to the participant's changing needs. All carers should be aware of the kit's location and contents."],
];

export function Blocks({ blocks }: { blocks: Block[] }) {
  return (
    <div className="doc-text">
      {blocks.map(([h, t], i) => (
        <div key={i}>{h && <h3>{h}</h3>}<p>{t}</p></div>
      ))}
    </div>
  );
}
