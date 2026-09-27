
export class ReceiptPrinter {
    private buffer: number[] = [];

    constructor() {
        this.reset();
    }

    private add(bytes: number[]) {
        this.buffer.push(...bytes);
    }

    private addText(text: string) {
        for (let i = 0; i < text.length; i++) {
            this.buffer.push(text.charCodeAt(i));
        }
    }

    // Commands
    reset() {
        this.buffer = [];
        this.add([0x1B, 0x40]); // Initialize
        return this;
    }

    alignCenter() {
        this.add([0x1B, 0x61, 1]);
        return this;
    }

    alignLeft() {
        this.add([0x1B, 0x61, 0]);
        return this;
    }

    alignRight() {
        this.add([0x1B, 0x61, 2]);
        return this;
    }

    bold(on: boolean = true) {
        this.add([0x1B, 0x45, on ? 1 : 0]);
        return this;
    }

    setSize(width: number, height: number) {
        // limit size to 1-8
        width = Math.max(1, Math.min(8, width));
        height = Math.max(1, Math.min(8, height));

        const n = ((width - 1) * 16) + (height - 1);
        this.add([0x1D, 0x21, n]);
        return this;
    }

    text(content: string) {
        this.addText(content);
        return this;
    }

    textLine(content: string) {
        this.addText(content + '\n');
        return this;
    }

    feed(lines: number = 1) {
        this.add([0x1B, 0x64, lines]);
        return this;
    }

    cut() {
        this.add([0x1D, 0x56, 66, 0]); // GS V 66 0
        return this;
    }

    line(char: string = '-') {
        this.textLine(char.repeat(32)); // 32 chars for standard 58mm, 48 for 80mm
        return this;
    }

    // Add raw bytes
    raw(bytes: number[]) {
        this.add(bytes);
        return this;
    }

    getData(): Uint8Array {
        return new Uint8Array(this.buffer);
    }
}
