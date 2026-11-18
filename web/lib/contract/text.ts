// The Knightingale casual employment contract, as carers sign it in the app.
// Wording follows the Bubble contract; typos fixed. Changing the wording here changes it for future signers only.

export const EMPLOYER = "Knightingale Pty Ltd (ACN: 674 982 293)";

export const ROLE_LABEL: Record<string, string> = { rn: "RN", en: "EN", dsw: "DSW", pca: "PCA" };
export const positionOf = (roles: string[] | null) =>
  (roles ?? []).map((r) => ROLE_LABEL[r]).filter(Boolean).join(" / ") || "carer";

/** Hourly rates by shift type, inclusive of casual loading. Columns: EN, PCA/DSW, RN. */
export const PAY_COLUMNS = ["EN", "PCA / DSW", "RN"] as const;
export const PAY_ROWS: [string, number, number, number][] = [
  ["AM", 50, 40, 80],
  ["PM", 55, 45, 90],
  ["NS", 60, 50, 95],
  ["SAT", 70, 55, 100],
  ["SUN", 80, 65, 110],
  ["P/H", 110, 90, 140],
  ["O/T", 60, 50, 95],
];

export type Block = { h?: string; p?: string[]; list?: string[]; sub?: string[]; bullets?: string[]; after?: string[]; table?: true };

export const CONTRACT: Block[] = [
  { h: "Casual Employment", p: ["Your employment is on a casual basis, which means that:"], list: [
    "There is no firm advance commitment by Knightingale to provide you with continuing and indefinite work (for the avoidance of doubt, a regular pattern of hours does not of itself indicate a firm advance commitment to continuing and indefinite work according to an agreed pattern of work);",
    "Knightingale can elect to offer you work and you may elect to accept or reject this work; and",
    "You will work only as required by Knightingale.",
  ] },
  { h: "Position", p: ["You will be (or are) employed as a {position}."] },
  { h: "Warranties", p: ["You warrant that you:"], bullets: [
    "Possess the experience, credentials and qualifications represented to Knightingale by or on your behalf.",
    "Have the right to reside and work in Australia.",
    "Have disclosed to Knightingale all interests or obligations that might have the potential to conflict with Knightingale's interests.",
    "Have no interests or obligations that are inconsistent with, or that would prevent, limit, or adversely affect you complying with your obligations under this agreement.",
  ], after: ["Please notify us if any of these circumstances change."] },
  { h: "Responsibilities", p: [
    "The responsibilities of your position are as advised to you from time to time. Your responsibilities may be varied from time to time by Knightingale.",
    "In carrying out and performing these duties and responsibilities you shall:",
  ], list: [
    "During the hours required by Knightingale, devote your full time and attention exclusively to your duties.",
    "Behave appropriately and act properly.",
    "Perform the duties and exercise the powers and functions which from time to time are assigned to you.",
    "Carry out all lawful and reasonable requests, directions and instructions.",
    "In all respects, conform to and comply with all reasonable directions given, and policies and procedures made by Knightingale, as may be varied from time to time.",
    "Wear approved apparel.",
    "Promote Knightingale's best interests.",
    "Carry out your employment to the best of your ability and judgement and embrace Knightingale's philosophy and values.",
    "Not engage in conduct which damages the name, reputation, standing and/or commercial interests of Knightingale.",
  ] },
  { h: "Assignment Based Employment", p: ["Being employed on a casual basis, you acknowledge and agree that:"], list: [
    "Your employment will involve performing duties on-site at a Knightingale client's premises or residence (each an ‘Assignment’);",
    "You may undertake one or more Assignments on any given day;",
    "You may accept or reject any offer of an Assignment made to you by Knightingale;",
    "Knightingale is not obliged to offer you any minimum number of Assignments; and",
    "Whilst Knightingale may provide an estimate as to the likely duration of an Assignment, the actual duration of an Assignment is determined by the client, the subject of the Assignment, and your entitlement to a wage under this agreement for work performed shall be based and calculated on the greater of: (i) the actual duration of each Assignment undertaken by you; and (ii) the relevant minimum engagement period.",
  ] },
  { h: "Line of Authority", p: ["You will report directly to Paul, the founder of Knightingale."] },
  { h: "Duration", p: ["Your appointment continues until termination of your employment in accordance with this agreement."] },
  { h: "Wage", p: ["Your wage is detailed below. It is an hourly rate inclusive of a casual loading. Your casual loading is the greater of:"], list: [
    "The relevant casual loading under any relevant modern award that applies to your employment; and",
    "The difference between the minimum base rate of pay under any relevant modern award that applies to your employment and your wage.",
  ] },
  { table: true },
  { p: ["Payment of the casual loading is satisfaction of, and compensates you for, the uncertainty and irregularity of work associated with casual employment as well as the following entitlements:"], list: [
    "Paid annual leave;", "Paid personal/carer's leave;", "Paid compassionate leave;", "Payment for absence on a public holiday;", "Payment in lieu of notice of termination; and", "Redundancy pay.",
  ] },
  { p: ["Your wage will be calculated and paid weekly in arrears after each Assignment if:"], bullets: [
    "Aged Care: you check in at the start of your shift.",
    "NDIS/Community: you check in, check out and write a progress note.",
  ], after: ["You acknowledge and agree that each Assignment is regarded as a separate and distinct work shift, meaning that Knightingale shall not pay to you (nor is legally obliged to pay to you):"] },
  { list: ["A wage for time spent travelling to and from each Assignment; and", "Any vehicle (or similar) allowance for kilometres travelled by you to and from each Assignment."] },
  { h: "Superannuation", p: ["Superannuation contributions are those contributions which Knightingale is required to make to satisfy its superannuation obligations in respect of you under the Superannuation Guarantee (Administration) Act 1992, and will be paid by Knightingale into the employer fund or such other superannuation fund as may be nominated by you.", "Under Payday Super, which started on 1 July 2026, Knightingale pays super at the same time as your wages, so that contributions reach your super fund within 7 business days of payday."] },
  { h: "Method of Payment", p: ["Your wage and other benefits will be paid by way of direct deposit to a bank account nominated by you."] },
  { h: "Expenses", p: ["You must ensure that any business expense has been approved prior to the expenditure being incurred, and that you have detailed tax receipts for the expenses incurred."] },
  { h: "Deductions", p: ["We are entitled to deduct from your wage or any termination payment any overpayment of wages or other benefits."] },
  { h: "Offset", p: [
    "Your wage and other benefits meet or exceed any minimum hourly rate or wage that may be set out in the Fair Work Act 2009, modern award, or registered agreement for the type of work that you perform.",
    "To the extent the Fair Work Act 2009, a modern award or registered agreement applies to your employment, it is expressly agreed that:",
  ], list: [
    "Your wage and other benefits are in satisfaction of your minimum entitlements (including, without limitation, minimum wage rates, overtime or time off in lieu, leave entitlements, public holidays, penalties and allowances) under the Fair Work Act 2009, modern award or registered agreement as amended from time to time;",
    "Knightingale is entitled to offset against your wage and other benefits including, without limitation, any overtime or time off in lieu, leave entitlement, public holidays, penalties and allowances provided by the Fair Work Act 2009, modern award or registered agreement as amended from time to time; and",
    "For the purposes of calculating the offset amount in this clause, the minimum wage rate under the Fair Work Act 2009, modern award or registered agreement shall be used.",
  ] },
  { h: "Hours of Work", p: ["You acknowledge and agree that:"], list: [
    "You are required to work the hours the subject of each Assignment agreed to be undertaken by you.",
    "Each Assignment undertaken by you is to be regarded as a separate and distinct work shift, meaning that you will not be entitled to (i) regard time spent travelling to and from each Assignment as hours worked, or (ii) payment of a travel allowance for travel to and from each Assignment; and",
    "If you are unable to undertake an Assignment agreed to be undertaken by you for reasons that are outside of your control, you shall notify Knightingale as soon as practicable of your inability, ensuring that, where possible, Knightingale has sufficient time to allocate that Assignment to another Knightingale employee.",
  ], after: ["You agree that you may be required to attend conferences, trade shows and other functions on behalf of Knightingale as directed by Knightingale from time to time and, in such an event, you shall be paid for all time spent in attending that event."] },
  { h: "Our Property", p: [
    "You may at any time be required to return any or all Knightingale property which may be in your possession, including any Confidential Information, documents, equipment or software (including any computer information) and keys.",
    "You agree and undertake not to retain copies of any such confidential information.",
  ] },
  { h: "Leave Generally", p: [
    "The rules set out in the Fair Work Act 2009 in relation to the taking of compassionate leave, carer's leave and parental leave will apply in conjunction with this agreement.",
  ] },
  { h: "Termination", p: ["Your employment may be terminated at any time by either Knightingale or yourself with 1 day's notice, or without notice for serious misconduct."] },
  { h: "Confidential Information", p: [
    "“Confidential Information” means all confidential information owned by or belonging to Knightingale, which includes, but is not limited to, any information specifically designated as confidential, or reasonably regarded as confidential, by Knightingale and our clients.",
    "You must:",
  ], list: [
    "Take all precautions necessary to prevent disclosure of any of the Confidential Information;",
    "Not use or attempt to use any of the Confidential Information in any manner which may injure or cause loss either directly or indirectly to Knightingale, or which may be likely to do so;",
    "Not disclose any of the Confidential Information to any person other than as directed by Knightingale; and",
    "Use Confidential Information solely for the purposes of this agreement.",
  ], after: ["This provision continues to apply after this agreement comes to an end."] },
  { h: "Workplace Health and Safety", p: [
    "You acknowledge and agree that you are under the direction and supervision of a Knightingale client during each Assignment undertaken by you.",
    "Knightingale will not tolerate any breach of workplace health and safety legal requirements. If you become aware of a breach or potential WHS issue, you must immediately report it to your manager or take reasonable steps to remedy such a breach or potential breach.",
  ] },
  { h: "Conflicts of Interest", p: ["During your employment you must not be engaged by or have a direct or indirect interest in any other business, person, company, or partnership whose interests are in, or may come into, conflict with Knightingale, or which may prejudice your ability to perform your duties, without first obtaining written permission from Knightingale."] },
  { h: "Policies", p: [
    "Knightingale has a variety of policies and procedures which you must adhere to during your employment. These policies and procedures may be implemented, varied, or delegated from time to time by Knightingale in its absolute discretion. These policies and procedures do not give rise to a legal right or benefit enforceable by you or form part of this agreement.",
    "To the extent of any inconsistency between this agreement and Knightingale policies and procedures, the terms of this agreement shall prevail.",
  ] },
  { h: "Variation", p: ["The agreement is not varied or modified in any way unless such variation or modification is agreed to in writing by you and Paul, the founder of Knightingale."] },
];
