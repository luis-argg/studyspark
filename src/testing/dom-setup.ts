/**
 * jsdom no implementa el método `showModal()` de `<dialog>`, que es justo lo
 * que usan los modales de la app (tarea, apunte, materia y confirmación).
 *
 * El stub mantiene `open` sincronizado y dispara `close` al cerrar, igual que
 * el navegador, para que los `effect` que sincronizan el diálogo se comporten
 * como en producción.
 */
type DialogInternals = HTMLDialogElement & {
  showModal?: () => void;
  show?: () => void;
  close?: (returnValue?: string) => void;
};

const proto = HTMLDialogElement.prototype as DialogInternals;

if (typeof proto.showModal !== 'function') {
  proto.showModal = function showModal(this: HTMLDialogElement): void {
    this.open = true;
  };

  proto.show = function show(this: HTMLDialogElement): void {
    this.open = true;
  };

  proto.close = function close(this: HTMLDialogElement, returnValue?: string): void {
    this.open = false;

    if (returnValue !== undefined) {
      this.returnValue = returnValue;
    }

    this.dispatchEvent(new Event('close'));
  };
}
