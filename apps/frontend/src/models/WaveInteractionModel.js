export class WaveInteractionModel {
    constructor(initialValues = { gm: [3, 3, 3], pd: [5, 5, 5] }) {
        this.values = initialValues;
        this.listeners = new Set();
    }

    getSnapshot = () => {
        return this.values;
    };

    subscribe = (listener) => {
        this.listeners.add(listener);
        return () => this.listeners.delete(listener);
    };

    emitChange() {
        this.listeners.forEach(listener => listener());
    }

    setValues(newValues) {
        // Guarantee a new object reference so useSyncExternalStore detects the change
        this.values = {
            gm: [...newValues.gm],
            pd: [...newValues.pd],
            leftGm: newValues.leftGm,
            leftPd: newValues.leftPd,
            rightGm: newValues.rightGm,
            rightPd: newValues.rightPd
        };
        this.emitChange();
    }


}
