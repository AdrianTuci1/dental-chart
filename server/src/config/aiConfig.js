require('dotenv').config();

const aiConfig = {
    modalInferenceUrl: process.env.MODAL_INFERENCE_URL || 'https://adrian-tucicovenco--dental-tooth-segmentation-api-predict.modal.run',
};

module.exports = aiConfig;
