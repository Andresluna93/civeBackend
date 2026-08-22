import axios from "axios";

const {
  WHATSAPP_API_VERSION,
  WHATSAPP_PHONE_NUMBER_ID,
  WHATSAPP_BUSINESS_ACCOUNT_ID,
  WHATSAPP_ACCESS_TOKEN,
} = process.env;

export const enviarTemplateWhatsapp = async ({
  to,
  templateName,
  languageCode,
  components,
}) => {
  const url = `https://graph.facebook.com/${WHATSAPP_API_VERSION}/${WHATSAPP_PHONE_NUMBER_ID}/messages`;

  //const components = [];
  /*if (headerParametros?.length) {
    components.push({ type: "header", parameters: headerParametros });
  }*/
  /*if (bodyParametros?.length) {
    components.push({ type: "body", parameters: bodyParametros });
  }*/

  const { data } = await axios.post(
    url,
    {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to,
      type: "template",
      template: {
        name: templateName,
        language: { code: languageCode },
        components,
      },
    },
    {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
      },
    },
  );

  return data;
};

export const obtenerListadoTemplates = async () => {
  let url = `https://graph.facebook.com/${WHATSAPP_API_VERSION}/${WHATSAPP_BUSINESS_ACCOUNT_ID}/message_templates?limit=100`;
  const templates = [];

  while (url) {
    const { data } = await axios.get(url, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
      },
    });

    console.log(`página con ${data.data.length} templates, next=${data.paging?.next}`);
    templates.push(...data.data);
    url = data.paging?.next || null;
  }

  console.log(`total acumulado: ${templates.length}`);
  return templates;
};
