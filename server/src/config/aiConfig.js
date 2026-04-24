require('dotenv').config();

const aiConfig = {
    modalInferenceUrl: process.env.MODAL_INFERENCE_URL || 'https://adriantucicovenco--dental-chart-api-predict.modal.run',
};

module.exports = aiConfig;
