/**
 * Aggregated translations map
 * De-minified - each language is now in its own file for readability
 */

import { baseTranslations } from "../baseTranslations";
import type { Language, Translations } from "../types";
import { abTranslations } from "./ab";
import { afTranslations } from "./af";
import { ainTranslations } from "./ain";
import { akkTranslations } from "./akk";
import { amTranslations } from "./am";
import { anTranslations } from "./an";
import { angTranslations } from "./ang";
import { arTranslations } from "./ar";
import { astTranslations } from "./ast";
import { avTranslations } from "./av";
import { aveTranslations } from "./ave";
import { azTranslations } from "./az";
import { balTranslations } from "./bal";
import { beTranslations } from "./be";
import { bgTranslations } from "./bg";
import { caTranslations } from "./ca";
import { ceTranslations } from "./ce";
import { coTranslations } from "./co";
import { crhTranslations } from "./crh";
import { csTranslations } from "./cs";
import { cuTranslations } from "./cu";
import { cvTranslations } from "./cv";
import { cyTranslations } from "./cy";
import { daTranslations } from "./da";
import { deTranslations } from "./de";
import { egyTranslations } from "./egy";
import { elTranslations } from "./el";
import { elxTranslations } from "./elx";
import { eoTranslations } from "./eo";
import { esTranslations } from "./es";
import { etTranslations } from "./et";
import { euTranslations } from "./eu";
import { faTranslations } from "./fa";
import { fiTranslations } from "./fi";
import { foTranslations } from "./fo";
import { frTranslations } from "./fr";
import { fyTranslations } from "./fy";
import { gaTranslations } from "./ga";
import { gdTranslations } from "./gd";
import { glTranslations } from "./gl";
import { gmyTranslations } from "./gmy";
import { gotTranslations } from "./got";
import { grcTranslations } from "./grc";
import { gswTranslations } from "./gsw";
import { heTranslations } from "./he";
import { hiTranslations } from "./hi";
import { hitTranslations } from "./hit";
import { hrTranslations } from "./hr";
import { htTranslations } from "./ht";
import { huTranslations } from "./hu";
import { hyTranslations } from "./hy";
import { iaTranslations } from "./ia";
import { idTranslations } from "./id";
import { isTranslations } from "./is";
import { itTranslations } from "./it";
import { iuTranslations } from "./iu";
import { jaTranslations } from "./ja";
import { jvTranslations } from "./jv";
import { kaTranslations } from "./ka";
import { kkTranslations } from "./kk";
import { knTranslations } from "./kn";
import { koTranslations } from "./ko";
import { krlTranslations } from "./krl";
import { kuTranslations } from "./ku";
import { kwTranslations } from "./kw";
import { laTranslations } from "./la";
import { ladTranslations } from "./lad";
import { lrcTranslations } from "./lrc";
import { ltTranslations } from "./lt";
import { lvTranslations } from "./lv";
import { lycTranslations } from "./lyc";
import { lydTranslations } from "./lyd";
import { mkTranslations } from "./mk";
import { msTranslations } from "./ms";
import { nahTranslations } from "./nah";
import { nlTranslations } from "./nl";
import { noTranslations } from "./no";
import { nonTranslations } from "./non";
import { nurTranslations } from "./nur";
import { ocTranslations } from "./oc";
import { osTranslations } from "./os";
import { otkTranslations } from "./otk";
import { palTranslations } from "./pal";
import { papTranslations } from "./pap";
import { pcmTranslations } from "./pcm";
import { peoTranslations } from "./peo";
import { phnTranslations } from "./phn";
import { plTranslations } from "./pl";
import { psTranslations } from "./ps";
import { ptTranslations } from "./pt";
import { quTranslations } from "./qu";
import { rmTranslations } from "./rm";
import { roTranslations } from "./ro";
import { ruTranslations } from "./ru";
import { rueTranslations } from "./rue";
import { saTranslations } from "./sa";
import { scnTranslations } from "./scn";
import { skTranslations } from "./sk";
import { slTranslations } from "./sl";
import { srTranslations } from "./sr";
import { suTranslations } from "./su";
import { suxTranslations } from "./sux";
import { svTranslations } from "./sv";
import { swTranslations } from "./sw";
import { taTranslations } from "./ta";
import { tiTranslations } from "./ti";
import { tlyTranslations } from "./tly";
import { tokTranslations } from "./tok";
import { trTranslations } from "./tr";
import { ttTranslations } from "./tt";
import { tttTranslations } from "./ttt";
import { txrTranslations } from "./txr";
import { ugaTranslations } from "./uga";
import { ukTranslations } from "./uk";
import { urTranslations } from "./ur";
import { uzTranslations } from "./uz";
import { valTranslations } from "./val";
import { viTranslations } from "./vi";
import { xclTranslations } from "./xcl";
import { xhuTranslations } from "./xhu";
import { xibTranslations } from "./xib";
import { xpgTranslations } from "./xpg";
import { xurTranslations } from "./xur";
import { yiTranslations } from "./yi";
import { yueTranslations } from "./yue";
import { zghTranslations } from "./zgh";
import { zhTranslations } from "./zh";
import { zuTranslations } from "./zu";

export const translations: Record<Language, Translations> = {
  ab: abTranslations,
  af: afTranslations,
  ain: ainTranslations,
  akk: akkTranslations,
  am: amTranslations,
  an: anTranslations,
  ang: angTranslations,
  ar: arTranslations,
  ast: astTranslations,
  av: avTranslations,
  ave: aveTranslations,
  az: azTranslations,
  bal: balTranslations,
  be: beTranslations,
  bg: bgTranslations,
  ca: caTranslations,
  ce: ceTranslations,
  co: coTranslations,
  crh: crhTranslations,
  cs: csTranslations,
  cu: cuTranslations,
  cv: cvTranslations,
  cy: cyTranslations,
  da: daTranslations,
  de: deTranslations,
  egy: egyTranslations,
  el: elTranslations,
  elx: elxTranslations,
  en: baseTranslations,
  eo: eoTranslations,
  es: esTranslations,
  et: etTranslations,
  eu: euTranslations,
  fa: faTranslations,
  fi: fiTranslations,
  fo: foTranslations,
  fr: frTranslations,
  fy: fyTranslations,
  ga: gaTranslations,
  gd: gdTranslations,
  gl: glTranslations,
  gmy: gmyTranslations,
  got: gotTranslations,
  grc: grcTranslations,
  gsw: gswTranslations,
  he: heTranslations,
  hi: hiTranslations,
  hit: hitTranslations,
  hr: hrTranslations,
  ht: htTranslations,
  hu: huTranslations,
  hy: hyTranslations,
  ia: iaTranslations,
  id: idTranslations,
  is: isTranslations,
  it: itTranslations,
  iu: iuTranslations,
  ja: jaTranslations,
  jv: jvTranslations,
  ka: kaTranslations,
  kk: kkTranslations,
  kn: knTranslations,
  ko: koTranslations,
  krl: krlTranslations,
  ku: kuTranslations,
  kw: kwTranslations,
  la: laTranslations,
  lad: ladTranslations,
  lrc: lrcTranslations,
  lt: ltTranslations,
  lv: lvTranslations,
  lyc: lycTranslations,
  lyd: lydTranslations,
  mk: mkTranslations,
  ms: msTranslations,
  nah: nahTranslations,
  nl: nlTranslations,
  no: noTranslations,
  non: nonTranslations,
  nur: nurTranslations,
  oc: ocTranslations,
  os: osTranslations,
  otk: otkTranslations,
  pal: palTranslations,
  pap: papTranslations,
  pcm: pcmTranslations,
  peo: peoTranslations,
  phn: phnTranslations,
  pl: plTranslations,
  ps: psTranslations,
  pt: ptTranslations,
  qu: quTranslations,
  rm: rmTranslations,
  ro: roTranslations,
  ru: ruTranslations,
  rue: rueTranslations,
  sa: saTranslations,
  scn: scnTranslations,
  sk: skTranslations,
  sl: slTranslations,
  sr: srTranslations,
  su: suTranslations,
  sux: suxTranslations,
  sv: svTranslations,
  sw: swTranslations,
  ta: taTranslations,
  ti: tiTranslations,
  tly: tlyTranslations,
  tok: tokTranslations,
  tr: trTranslations,
  tt: ttTranslations,
  ttt: tttTranslations,
  txr: txrTranslations,
  uga: ugaTranslations,
  uk: ukTranslations,
  ur: urTranslations,
  uz: uzTranslations,
  val: valTranslations,
  vi: viTranslations,
  xcl: xclTranslations,
  xhu: xhuTranslations,
  xib: xibTranslations,
  xpg: xpgTranslations,
  xur: xurTranslations,
  yi: yiTranslations,
  yue: yueTranslations,
  zgh: zghTranslations,
  zh: zhTranslations,
  zu: zuTranslations,
};
