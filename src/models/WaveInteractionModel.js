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
        this.values = newValues;
        this.emitChange();
    }

    updatePoint(type, index, level) {
        const newGm = [...this.values.gm];
        const newPd = [...this.values.pd];

        if (type === 'gm') {
            newGm[index] = level;
            // Constraint: PD >= GM. If GM moves "deeper" than PD, push PD down.
            // Level 12 is Deepest. Level 1 is Highest (Crown).
            // So if GM > PD (GM is deeper than PD), set PD = GM.
            if (newGm[index] > newPd[index]) {
                newPd[index] = newGm[index];
            }
        } else {
            newPd[index] = level;
            // Constraint: PD >= GM. If PD moves "higher" than GM (PD < GM), stop at GM.
            if (newPd[index] < newGm[index]) {
                newPd[index] = newGm[index];
            }
        }

        this.values = { gm: newGm, pd: newPd };
        this.emitChange();
    }
}
