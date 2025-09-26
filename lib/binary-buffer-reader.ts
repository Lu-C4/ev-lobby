import * as THREE from "three"

export class BinaryBufferReader {
  private _buffer: ArrayBuffer
  private _index: number
  private _view: DataView

  constructor(buffer: ArrayBuffer) {
    this._buffer = buffer
    this._index = 0
    this._view = new DataView(buffer)
  }

  chompInt16(): number {
    const value = this._view.getInt16(this._index, true)
    this._index += 2
    return value
  }

  chompUint16(): number {
    const value = this._view.getUint16(this._index, true)
    this._index += 2
    return value
  }

  chompUint32(): number {
    const value = this._view.getUint32(this._index, true)
    this._index += 4
    return value
  }

  chompByte(): number {
    const value = this._view.getUint8(this._index)
    this._index += 1
    return value
  }

  chompByteArray(length: number): Uint8Array {
    const result = new Uint8Array(this._buffer.slice(this._index, this._index + length))
    this._index += length
    return result
  }

  chompUint16Array(length: number): Uint16Array {
    const result = new Uint16Array(length)
    for (let i = 0; i < length; i++) {
      result[i] = this.chompUint16()
    }
    return result
  }

  chompFloat32(): number {
    const value = this._view.getFloat32(this._index, true)
    this._index += 4
    return value
  }

  chompFloat32Array(length: number): Float32Array {
    const result = new Float32Array(length)
    for (let i = 0; i < length; i++) {
      result[i] = this.chompFloat32()
    }
    return result
  }

  chompVector3(): THREE.Vector3 {
    return new THREE.Vector3(this.chompFloat32(), this.chompFloat32(), this.chompFloat32())
  }

  chompVector4(): THREE.Vector4 {
    return new THREE.Vector4(this.chompFloat32(), this.chompFloat32(), this.chompFloat32(), this.chompFloat32())
  }

  chompQuaternion(): THREE.Quaternion {
    return new THREE.Quaternion(this.chompFloat32(), this.chompFloat32(), this.chompFloat32(), this.chompFloat32())
  }

  chompMatrix4(): THREE.Matrix4 {
    const matrix = new THREE.Matrix4()
    const elements = [
      this.chompFloat32(),
      this.chompFloat32(),
      this.chompFloat32(),
      this.chompFloat32(),
      this.chompFloat32(),
      this.chompFloat32(),
      this.chompFloat32(),
      this.chompFloat32(),
      this.chompFloat32(),
      this.chompFloat32(),
      this.chompFloat32(),
      this.chompFloat32(),
      this.chompFloat32(),
      this.chompFloat32(),
      this.chompFloat32(),
      this.chompFloat32(),
    ]
    matrix.fromArray(elements)
    return matrix
  }

  chompColorRGB(): THREE.Color {
    const r = this.chompByte() / 255
    const g = this.chompByte() / 255
    const b = this.chompByte() / 255
    return new THREE.Color(r, g, b)
  }

  chompColorRGBA(): [THREE.Color, number] {
    const r = this.chompByte() / 255
    const g = this.chompByte() / 255
    const b = this.chompByte() / 255
    const a = this.chompByte() / 255
    return [new THREE.Color(r, g, b), a]
  }

  chompString(): string {
    const length = this.chompByte()
    const bytes = this.chompByteArray(length)
    return Array.from(bytes)
      .map((byte) => String.fromCharCode(byte))
      .join("")
  }
}
