// Environment loading belongs to the entrypoints (app.js, the migration scripts); a
// module-level dotenv call here would also run inside test workers and the Worker bundle.
const aiConfig = {
    modalInferenceUrl: process.env.MODAL_INFERENCE_URL || 'https://adrian-tucicovenco--dental-tooth-segmentation-api-predict.modal.run',
};

module.exports = aiConfig;
