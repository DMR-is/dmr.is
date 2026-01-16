import { coatOfArmsSvg } from './coat-of-arms'

export const firstPageHeader = (
  issueNr: number,
  yearsIssued: number,
  fullDate: string,
) => `
  <div style="width: 100%; margin: 0 auto 0.5cm;">
    <div style="
      display: flex;
      column-gap: 2px;
      flex-direction: column;
      padding-bottom: 10px;
      border-bottom: 2px solid #000;
    ">
      <div style="
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 0px;
      ">
        <div>${coatOfArmsSvg}</div>
        <span style="
          font-family: 'Times New Roman', serif;
          font-size: 68px;
          font-weight: 700;
          letter-spacing: 0.2rem;
          line-height: 1;
        ">
          Lögbirtingablað
        </span>
      </div>

      <div style="
        display: flex;
        justify-content: space-between;
        align-items: flex-end;
        margin-top: 16px;
      ">
        <div style="font-size: 12px;">
          Gefið út samkvæmt lögum nr. 15 10. mars 2005
        </div>
        <div style="
          font-family: 'Times New Roman', serif;
          font-size: 9px;
          font-weight: bold;
        ">
          Heimilisfang: Ránarbraut 1, 870 Vík. Sími 458 2800. Myndsendir 458 2860.<br>
          Netfang: logbirtingabladid@syslumenn.is • Veffang: www.logbirtingablad.is.<br>
          ISSN 1670-0236 (vefútgáfa) – ISSN 1670-0228 (prentuð útgáfa)<br>
          Árg. kostar kr. 82.000, eintakið kr. 802.
        </div>
      </div>
    </div>

    <div>
      <div style="
        font-size: 12px;
        display: flex;
        font-weight: bold;
        justify-content: space-between;
        align-items: center;
        border-bottom: 1px solid #000;
        padding: 8px 0;
      ">
        <span style="font-family: 'Times New Roman', serif;">
          Nr. ${issueNr} <span style="margin-left: 8px;">${yearsIssued}. ár</span>
        </span>
        <span style="font-family: 'Times New Roman', serif;">
          ${fullDate}
        </span>
      </div>
    </div>
  </div>
`

export const pageHeaders = (issue: string) => `
  <div style="width: 100%; margin: 0 auto;">
    <div style="
      font-size: 12px;
      margin: 0 calc(1cm - 0.33em);
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 2px solid #000;
      padding: 6px 0;
    ">
      <span></span>
      <span style="font-family: 'Times New Roman', serif;">
        Lögbirtingablað
      </span>
      <span style="font-family: 'Times New Roman', serif;">
        Nr. ${issue}
      </span>
    </div>
  </div>
`

export const lastPageFooter = (
  syslumadur: string,
  issueNr: number,
  year: number,
) => `
  <div style="
    width: 100%;
    margin-top: 2cm;
  ">
    <div style="
      padding-bottom: 2px;
      width: 100%;
      border-top: 2px solid #000;
      padding-top: 4px;
      font-size: 12px;
      font-family: 'Times New Roman', serif;
    ">
      <div style="text-align: right; font-size: 16px;">
        Lögbirtingablað,
      </div>
      <br>
      <div style="margin-top: 2px; text-align: right; font-size: 14px;">
        ${issueNr}. tölublað ${year}.
      </div>
    </div>

    <div style="
      width: 45%;
      margin-left: auto;
      border-bottom: 1px solid #000;
      border-top: 1px solid #000;
      padding-top: 4px;
      padding-bottom: 4px;
      font-size: 12px;
      font-family: 'Times New Roman', serif;
    ">
      <span style="text-align: right; font-size: 12px; display:block;">
        Útgefandi og ábyrgðarmaður, sýslumaðurinn á Suðurlandi
      </span>
      <div style="
        margin-top: 2px;
        text-align: right;
        font-size: 12px;
        font-weight: bold;
      ">
        ${syslumadur}
      </div>
    </div>
    <div style="font-size: 12px; margin-top: 32px; text-align: left;">Afritun eða dreifing þessa efnis er óheimil. Efnið kann að innihalda persónuupplýsingar sem njóta verndar samkvæmt lögum nr. 90/2018 og reglugerð (ESB) 2016/679 (GDPR). Óheimil meðferð getur varðað við lög.</div>
  </div>
`

export const pdfMetaTitle = (title: string) =>
  `<head><title>${title}</title></head>`

export const issueOverwriteCss = `
  @page:first { margin-top: 0.3cm; }
  @page { margin: 3cm calc(2cm - 0.33em); }
`
