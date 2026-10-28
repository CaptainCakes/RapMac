/**
 * RAPTOR .rap Native MS-NRBF Binary Deserializer & Serializer
 * 100% interoperability with Windows RAPTOR (raptor.exe).
 * Based directly on Windows RAPTOR C# source code (Visual_Flow_Form.cs, Component.cs, etc.)
 */

const MS_NRBF_HEADER = Buffer.from('0001000000ffffffff0100000000000000', 'hex');

class NrbfStreamParser {
  constructor(buf) {
    this.buf = buf;
    this.pos = 0;
    this.objects = new Map();
    this.classes = new Map();
  }
  readByte() { return this.buf[this.pos++]; }
  readInt32() { const val = this.buf.readInt32LE(this.pos); this.pos += 4; return val; }
  readBoolean() { return this.readByte() !== 0; }
  readString() {
    let len = 0, shift = 0;
    while (true) {
      const b = this.readByte();
      len |= (b & 0x7f) << shift;
      if (!(b & 0x80)) break;
      shift += 7;
    }
    const str = this.buf.toString('utf8', this.pos, this.pos + len);
    this.pos += len;
    return str;
  }
  parseStream() {
    if (this.buf.slice(this.pos, this.pos + 17).equals(MS_NRBF_HEADER)) {
      this.pos += 17;
    }
    let root = null;
    while (this.pos < this.buf.length) {
      const recordType = this.readByte();
      if (recordType === 11) break; // MessageEnd
      else if (recordType === 12) { this.readInt32(); this.readString(); } // BinaryLibrary
      else if (recordType === 5) { const obj = this.readClassWithMembersAndTypes(); if (!root) root = obj; }
      else if (recordType === 4) { const obj = this.readSystemClassWithMembersAndTypes(); if (!root) root = obj; }
      else if (recordType === 1) { const obj = this.readClassWithId(); if (!root) root = obj; }
      else if (recordType === 6) { const objId = this.readInt32(); const str = this.readString(); this.objects.set(objId, str); if (!root) root = str; }
      else if (recordType === 15) { const arr = this.readArraySinglePrimitive(); if (!root) root = arr; }
      else throw new Error('Unhandled record type: ' + recordType + ' at pos ' + (this.pos - 1));
    }
    return root;
  }
  readArraySinglePrimitive() {
    const objId = this.readInt32();
    const length = this.readInt32();
    const pt = this.readByte();
    const arr = this.buf.slice(this.pos, this.pos + length);
    this.pos += length;
    this.objects.set(objId, arr);
    return arr;
  }
  readClassWithMembersAndTypes() {
    const objId = this.readInt32();
    const name = this.readString();
    const memberCount = this.readInt32();
    const memberNames = [];
    for (let i = 0; i < memberCount; i++) memberNames.push(this.readString());
    const binaryTypes = [];
    for (let i = 0; i < memberCount; i++) binaryTypes.push(this.readByte());
    const additionalTypeInfo = [];
    for (let i = 0; i < memberCount; i++) {
      const bt = binaryTypes[i];
      if (bt === 0 || bt === 7) additionalTypeInfo.push({ primitiveType: this.readByte() });
      else if (bt === 3) additionalTypeInfo.push({ className: this.readString() });
      else if (bt === 4) { const className = this.readString(); const libId = this.readInt32(); additionalTypeInfo.push({ className, libId }); }
      else additionalTypeInfo.push(null);
    }
    const libraryId = this.readInt32();
    const classDef = { objId, name, memberCount, memberNames, binaryTypes, additionalTypeInfo, libraryId };
    this.classes.set(objId, classDef);
    const obj = { __id: objId, __className: name };
    this.objects.set(objId, obj);
    this.readMemberValues(obj, classDef);
    return obj;
  }
  readSystemClassWithMembersAndTypes() {
    const objId = this.readInt32();
    const name = this.readString();
    const memberCount = this.readInt32();
    const memberNames = [];
    for (let i = 0; i < memberCount; i++) memberNames.push(this.readString());
    const binaryTypes = [];
    for (let i = 0; i < memberCount; i++) binaryTypes.push(this.readByte());
    const additionalTypeInfo = [];
    for (let i = 0; i < memberCount; i++) {
      const bt = binaryTypes[i];
      if (bt === 0 || bt === 7) additionalTypeInfo.push({ primitiveType: this.readByte() });
      else if (bt === 3) additionalTypeInfo.push({ className: this.readString() });
      else if (bt === 4) { const className = this.readString(); const libId = this.readInt32(); additionalTypeInfo.push({ className, libId }); }
      else additionalTypeInfo.push(null);
    }
    const classDef = { objId, name, memberCount, memberNames, binaryTypes, additionalTypeInfo };
    this.classes.set(objId, classDef);
    const obj = { __id: objId, __className: name };
    this.objects.set(objId, obj);
    this.readMemberValues(obj, classDef);
    return obj;
  }
  readClassWithId() {
    const objId = this.readInt32();
    const metadataId = this.readInt32();
    const classDef = this.classes.get(metadataId);
    if (!classDef) throw new Error('Metadata ID not found: ' + metadataId);
    const obj = { __id: objId, __className: classDef.name };
    this.objects.set(objId, obj);
    this.readMemberValues(obj, classDef);
    return obj;
  }
  readMemberValues(obj, classDef) {
    for (let i = 0; i < classDef.memberCount; i++) {
      const name = classDef.memberNames[i];
      const bt = classDef.binaryTypes[i];
      const extra = classDef.additionalTypeInfo[i];
      obj[name] = this.readMemberValue(bt, extra);
    }
  }
  readMemberValue(binaryType, extra) {
    if (binaryType === 0) return this.readPrimitive(extra.primitiveType);
    return this.readObjectValue();
  }
  readPrimitive(pt) {
    if (pt === 1) return this.readBoolean();
    if (pt === 2) return this.readByte();
    if (pt === 7) { const v = this.buf.readInt16LE(this.pos); this.pos += 2; return v; }
    if (pt === 8) return this.readInt32();
    if (pt === 9) { const lo = this.buf.readInt32LE(this.pos); const hi = this.buf.readInt32LE(this.pos + 4); this.pos += 8; return lo; }
    if (pt === 11) { const v = this.buf.readFloatLE(this.pos); this.pos += 4; return v; }
    if (pt === 12) { const v = this.buf.readDoubleLE(this.pos); this.pos += 8; return v; }
    if (pt === 18) { this.pos += 8; return null; }
    throw new Error('Unhandled primitive type: ' + pt);
  }
  readObjectValue() {
    const recordType = this.readByte();
    if (recordType === 9) return { __ref: this.readInt32() };
    if (recordType === 10) return null;
    if (recordType === 6) {
      const objId = this.readInt32();
      const str = this.readString();
      this.objects.set(objId, str);
      return str;
    }
    if (recordType === 1) return this.readClassWithId();
    if (recordType === 5) return this.readClassWithMembersAndTypes();
    if (recordType === 4) return this.readSystemClassWithMembersAndTypes();
    throw new Error('Unhandled object record type: ' + recordType + ' at pos ' + (this.pos - 1));
  }
  resolve(val) {
    if (val && typeof val === 'object' && typeof val.__ref === 'number') {
      return this.objects.get(val.__ref);
    }
    return val;
  }
}

class RapBinaryParser {
  constructor(buffer) {
    if (typeof buffer === 'string') {
      this.buf = Buffer.from(buffer, 'utf8');
    } else if (Buffer.isBuffer(buffer)) {
      this.buf = buffer;
    } else if (buffer instanceof Uint8Array || (buffer && buffer.data)) {
      this.buf = Buffer.from(buffer.data || buffer);
    } else {
      this.buf = Buffer.alloc(0);
    }
  }

  static parse(buffer) {
    return new RapBinaryParser(buffer).parse();
  }

  isBinaryRap() {
    if (!this.buf || this.buf.length < 17) return false;
    return this.buf.subarray(0, 17).equals(MS_NRBF_HEADER);
  }

  parse() {
    if (!this.isBinaryRap()) {
      try {
        const text = this.buf.toString('utf8');
        const json = JSON.parse(text);
        if (json && json.tabs && Array.isArray(json.tabs)) return json;
      } catch (e) {}
      return null;
    }

    const offsets = [];
    let pos = 0;
    while ((pos = this.buf.indexOf(MS_NRBF_HEADER, pos)) !== -1) {
      offsets.push(pos);
      pos += MS_NRBF_HEADER.length;
    }
    offsets.push(this.buf.length);

    if (offsets.length < 3) return null;

    const parseStreamAt = (idx) => {
      const chunk = this.buf.slice(offsets[idx], offsets[idx + 1]);
      const parser = new NrbfStreamParser(chunk);
      const root = parser.parseStream();
      return { parser, root };
    };

    let streamIdx = 0;
    const s0 = parseStreamAt(streamIdx++);
    const version = (typeof s0.root === 'number') ? s0.root : (s0.root && s0.root.m_value !== undefined ? s0.root.m_value : 17);

    let reverseLoop = false;
    if (version >= 13) {
      const s1 = parseStreamAt(streamIdx++);
      reverseLoop = !!(s1.root && s1.root.m_value !== undefined ? s1.root.m_value : s1.root);
    }

    const sTabCount = parseStreamAt(streamIdx++);
    const tabCount = (typeof sTabCount.root === 'number') ? sTabCount.root : (sTabCount.root && sTabCount.root.m_value !== undefined ? sTabCount.root.m_value : 1);

    const tabDescriptors = [];
    for (let i = 0; i < tabCount; i++) {
      if (streamIdx >= offsets.length - 1) break;
      const sName = parseStreamAt(streamIdx++);
      const name = typeof sName.root === 'string' ? sName.root : (sName.root && sName.root.value ? sName.root.value : ('Tab' + (i + 1)));
      let kind = 0;
      if (version >= 14 && streamIdx < offsets.length - 1) {
        const sKind = parseStreamAt(streamIdx++);
        kind = (sKind.root && sKind.root.value__ !== undefined) ? sKind.root.value__ : 0;
      }
      let paramCount = 0;
      if ((kind === 1 || kind === 2) && streamIdx < offsets.length - 1) {
        if (version >= 15 || kind === 2) {
          const sParams = parseStreamAt(streamIdx++);
          paramCount = (typeof sParams.root === 'number') ? sParams.root : (sParams.root && sParams.root.m_value !== undefined ? sParams.root.m_value : 0);
        }
      }
      tabDescriptors.push({ name, kind, paramCount });
    }

    const tabs = [];
    let nextNodeId = 1;

    for (let i = 0; i < tabDescriptors.length; i++) {
      const desc = tabDescriptors[i];
      if (streamIdx >= offsets.length - 1) break;
      const sAst = parseStreamAt(streamIdx++);
      if (version >= 17 && streamIdx < offsets.length - 1) {
        streamIdx++; // Ink overlay stream
      }

      const parser = sAst.parser;
      const startOval = sAst.root;
      if (!startOval || !startOval._Successor) {
        tabs.push({ name: desc.name, nodes: [] });
        continue;
      }

      function extractComment(comp) {
        if (!comp || !comp._comment) return null;
        const commentObj = parser.resolve(comp._comment);
        if (!commentObj) return null;
        const numLines = (typeof commentObj._num_lines === 'number') ? commentObj._num_lines : 0;
        const lines = [];
        for (let l = 0; l < numLines; l++) {
          const lText = parser.resolve(commentObj[`_line${l}`]);
          lines.push(lText != null ? lText : '');
        }
        return {
          text: lines.join('\n'),
          lines: lines,
          x: commentObj._x_location != null ? commentObj._x_location : 295,
          y: commentObj._y_location != null ? commentObj._y_location : 41,
          hostX: comp._x_location != null ? comp._x_location : 203,
          hostY: comp._y_location != null ? comp._y_location : 63
        };
      }

      let tabEndComment = null;

      function buildNodeList(firstComp) {
        const list = [];
        let curr = firstComp;
        const visited = new Set();
        while (curr && !visited.has(curr.__id)) {
          visited.add(curr.__id);
          const textStr = (parser.resolve(curr._text_str) || '').trim();
          const className = curr.__className;
          const compComment = extractComment(curr);

          if (className === 'raptor.Oval') {
            if (textStr.toLowerCase() === 'end') {
              if (compComment) tabEndComment = compComment;
              break;
            }
          } else if (className === 'raptor.Rectangle') {
            const kindVal = parser.resolve(curr._kind);
            const hasAssign = textStr.includes(':=') || (textStr.includes('=') && !/^(if|while|loop|[><])/i.test(textStr) && !textStr.includes('=='));
            const isCall = !hasAssign && (((kindVal && kindVal.value__ === 1) || kindVal === 1));

            if (isCall) {
              const nodeObj = {
                id: `${desc.name}_node_${nextNodeId++}`,
                type: 'call',
                callName: textStr
              };
              if (compComment) nodeObj.comment = compComment;
              list.push(nodeObj);
            } else {
              let variable = 'x', expression = '0';
              if (textStr.includes(':=')) {
                const parts = textStr.split(':=');
                variable = parts[0].trim();
                expression = parts.slice(1).join(':=').trim();
              } else if (textStr.includes('=')) {
                const parts = textStr.split('=');
                variable = parts[0].trim();
                expression = parts.slice(1).join('=').trim();
              } else {
                variable = textStr;
              }
              const nodeObj = {
                id: `${desc.name}_node_${nextNodeId++}`,
                type: 'assignment',
                variable,
                expression
              };
              if (compComment) nodeObj.comment = compComment;
              list.push(nodeObj);
            }
          } else if (className === 'raptor.Parallelogram') {
            const isInput = !!curr._is_input;
            if (isInput) {
              let prompt = (parser.resolve(curr._prompt) || '').trim();
              const nodeObj = {
                id: `${desc.name}_node_${nextNodeId++}`,
                type: 'input',
                prompt,
                variable: textStr
              };
              if (compComment) nodeObj.comment = compComment;
              list.push(nodeObj);
            } else {
              const nodeObj = {
                id: `${desc.name}_node_${nextNodeId++}`,
                type: 'output',
                expression: textStr
              };
              if (compComment) nodeObj.comment = compComment;
              list.push(nodeObj);
            }
          } else if (className === 'raptor.IF_Control') {
            const thenNodes = buildNodeList(parser.resolve(curr._left_Child));
            const elseNodes = buildNodeList(parser.resolve(curr._right_Child));
            const nodeObj = {
              id: `${desc.name}_node_${nextNodeId++}`,
              type: 'selection',
              condition: textStr,
              thenNodes,
              elseNodes
            };
            if (compComment) nodeObj.comment = compComment;
            list.push(nodeObj);
          } else if (className === 'raptor.Loop') {
            const beforeNodes = buildNodeList(parser.resolve(curr._before_Child));
            const afterNodes = buildNodeList(parser.resolve(curr._after_Child));
            const nodeObj = {
              id: `${desc.name}_node_${nextNodeId++}`,
              type: 'loop',
              condition: textStr,
              beforeNodes,
              afterNodes
            };
            if (compComment) nodeObj.comment = compComment;
            list.push(nodeObj);
          }

          const next = parser.resolve(curr._Successor);
          if (!next || next === curr) break;
          curr = next;
        }
        return list;
      }

      const startComment = extractComment(startOval);
      const nodes = buildNodeList(parser.resolve(startOval._Successor));
      const tabObj = { name: desc.name, nodes };
      if (startComment) tabObj.startComment = startComment;
      if (tabEndComment) tabObj.endComment = tabEndComment;
      tabs.push(tabObj);
    }

    return {
      title: 'Imported Flowchart',
      tabs
    };
  }
}

class AstGenerator {
  constructor() {
    this.chunks = [];
    this.nextObjId = 1;
    this.nextStrId = 5000;
    this.classMetaIds = new Map();
  }
  allocId() { return this.nextObjId++; }
  allocStrId() { return this.nextStrId++; }
  getBuffer() { return Buffer.concat(this.chunks); }
  write(buf) { this.chunks.push(buf); }
  writeByte(b) { this.chunks.push(Buffer.from([b])); }
  writeInt32(val) { const b = Buffer.alloc(4); b.writeInt32LE(val, 0); this.chunks.push(b); }
  writeBoolean(val) { this.writeByte(val ? 1 : 0); }
  writeString(str) {
    const strBytes = Buffer.from(str || '', 'utf8');
    let n = strBytes.length;
    const varint = [];
    while (true) {
      const byte = n & 0x7f;
      n >>= 7;
      if (n > 0) varint.push(byte | 0x80);
      else { varint.push(byte); break; }
    }
    this.chunks.push(Buffer.from(varint));
    this.chunks.push(strBytes);
  }
  writeObjString(str) {
    const id = this.allocStrId();
    this.writeByte(6);
    this.writeInt32(id);
    this.writeString(str);
  }
  writeNull() { this.writeByte(10); }
  writeGuid() {
    const id = -this.allocId();
    if (!this.classMetaIds.has('Guid')) {
      this.classMetaIds.set('Guid', id);
      this.writeByte(4);
      this.writeInt32(id);
      this.writeString('System.Guid');
      this.writeInt32(11);
      for (let k of ['_a','_b','_c','_d','_e','_f','_g','_h','_i','_j','_k']) this.writeString(k);
      for (let i = 0; i < 11; i++) this.writeByte(0);
      this.writeByte(8); this.writeByte(7); this.writeByte(7);
      for (let i = 0; i < 8; i++) this.writeByte(2);
      this.writeInt32(0x3847a1bc);
      const bBuf = Buffer.alloc(2); bBuf.writeInt16LE(0x4f12, 0); this.write(bBuf);
      const cBuf = Buffer.alloc(2); cBuf.writeInt16LE(0x6e93, 0); this.write(cBuf);
      for (let i = 0; i < 8; i++) this.writeByte(i + 1);
    } else {
      this.writeByte(1);
      this.writeInt32(id);
      this.writeInt32(this.classMetaIds.get('Guid'));
      this.writeInt32(0x3847a1bc);
      const bBuf = Buffer.alloc(2); bBuf.writeInt16LE(0x4f12, 0); this.write(bBuf);
      const cBuf = Buffer.alloc(2); cBuf.writeInt16LE(0x6e93, 0); this.write(cBuf);
      for (let i = 0; i < 8; i++) this.writeByte(i + 1);
    }
  }
  writeFootPrint(left = 43, right = 43, height = 36) {
    const id = this.allocId();
    if (!this.classMetaIds.has('FootPrint')) {
      this.classMetaIds.set('FootPrint', id);
      this.writeByte(5);
      this.writeInt32(id);
      this.writeString('raptor.Component+FootPrint');
      this.writeInt32(3);
      this.writeString('left'); this.writeString('right'); this.writeString('height');
      this.writeByte(0); this.writeByte(0); this.writeByte(0);
      this.writeByte(8); this.writeByte(8); this.writeByte(8);
      this.writeInt32(2);
      this.writeInt32(left); this.writeInt32(right); this.writeInt32(height);
    } else {
      this.writeByte(1);
      this.writeInt32(id);
      this.writeInt32(this.classMetaIds.get('FootPrint'));
      this.writeInt32(left); this.writeInt32(right); this.writeInt32(height);
    }
  }
  writeDrawingRect(x = 0, y = 0, width = 54, height = 36) {
    const id = -this.allocId();
    if (!this.classMetaIds.has('DrawingRect')) {
      this.classMetaIds.set('DrawingRect', id);
      this.writeByte(5);
      this.writeInt32(id);
      this.writeString('System.Drawing.Rectangle');
      this.writeInt32(4);
      this.writeString('x'); this.writeString('y'); this.writeString('width'); this.writeString('height');
      this.writeByte(0); this.writeByte(0); this.writeByte(0); this.writeByte(0);
      this.writeByte(8); this.writeByte(8); this.writeByte(8); this.writeByte(8);
      this.writeInt32(3);
      this.writeInt32(x); this.writeInt32(y); this.writeInt32(width); this.writeInt32(height);
    } else {
      this.writeByte(1);
      this.writeInt32(id);
      this.writeInt32(this.classMetaIds.get('DrawingRect'));
      this.writeInt32(x); this.writeInt32(y); this.writeInt32(width); this.writeInt32(height);
    }
  }
  writeKind(val = 0) {
    if (!this.classMetaIds.has('Kind_Of')) {
      const id = -this.allocId();
      this.classMetaIds.set('Kind_Of', id);
      this.writeByte(5);
      this.writeInt32(id);
      this.writeString('raptor.Rectangle+Kind_Of');
      this.writeInt32(1);
      this.writeString('value__');
      this.writeByte(0);
      this.writeByte(8);
      this.writeInt32(2);
      this.writeInt32(val);
    } else {
      const id = -this.allocId();
      this.writeByte(1);
      this.writeInt32(id);
      this.writeInt32(this.classMetaIds.get('Kind_Of'));
      this.writeInt32(val);
    }
  }
  writeRef(id) {
    this.writeByte(9);
    this.writeInt32(id);
  }
  writeCommentBox(comment) {
    if (!comment) {
      this.writeNull();
      return;
    }
    const id = this.allocId();
    let lines = [];
    if (Array.isArray(comment.lines)) {
      lines = comment.lines;
    } else if (typeof comment.text === 'string') {
      lines = comment.text.split('\n');
    } else {
      lines = [''];
    }
    const numLines = lines.length;
    const memberCount = 4 + numLines;

    this.writeByte(5); // ClassWithMembersAndTypes
    this.writeInt32(id);
    this.writeString('raptor.CommentBox');
    this.writeInt32(memberCount);

    this.writeString('_num_lines');
    this.writeString('_x_location');
    this.writeString('_y_location');
    this.writeString('_version');
    for (let i = 0; i < numLines; i++) {
      this.writeString('_line' + i);
    }

    for (let i = 0; i < 4; i++) this.writeByte(0);
    for (let i = 0; i < numLines; i++) this.writeByte(1);

    for (let i = 0; i < 4; i++) this.writeByte(8);
    this.writeInt32(2); // libraryId

    this.writeInt32(numLines);
    this.writeInt32(comment.x != null ? Math.round(comment.x) : 295);
    this.writeInt32(comment.y != null ? Math.round(comment.y) : 41);
    this.writeInt32(1); // _version = 1
    for (let i = 0; i < numLines; i++) {
      this.writeObjString(lines[i]);
    }
  }
  writeComponentValues(textStr, name, isChild, isBefore, isAfter, parentId, nextWriter, comment = null) {
    this.writeInt32(17);
    this.writeFootPrint();
    this.writeObjString(textStr);
    this.writeObjString(name);
    this.writeInt32(10);
    this.writeInt32(36);
    this.writeInt32(54);
    this.writeInt32(60);
    this.writeInt32(90);
    this.writeInt32(9);
    this.writeInt32(100);
    this.writeInt32(100);
    if (nextWriter) nextWriter(); else this.writeNull();
    if (parentId != null) this.writeRef(parentId); else this.writeNull();
    this.writeBoolean(isChild);
    this.writeBoolean(isBefore);
    this.writeBoolean(isAfter);
    this.writeBoolean(true);
    this.writeInt32(13);
    this.writeInt32(textStr.length);
    this.writeDrawingRect();
    if (comment) {
      this.writeCommentBox(comment);
    } else {
      this.writeNull();
    }
    this.writeGuid();
    this.writeGuid();
  }
  writeOval(textStr, isStart, parentId, nextWriter, comment = null) {
    const id = this.allocId();
    if (!this.classMetaIds.has('raptor.Oval')) {
      this.classMetaIds.set('raptor.Oval', id);
      this.writeByte(5);
      this.writeInt32(id);
      this.writeString('raptor.Oval');
      const members = ['_serialization_version','_FP','_text_str','_name','_proximity','_head_height','_head_width','_head_heightOrig','_head_widthOrig','_connector_length','_x_location','_y_location','_Successor','_parent','_is_child','_is_beforeChild','_is_afterChild','_full_text','_height_of_text','_char_length','_rect','_comment','_created_guid','_changed_guid'];
      this.writeInt32(members.length);
      for (let m of members) this.writeString(m);
      const bts = [0, 4, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 2, 2, 0, 0, 0, 0, 0, 0, 4, 2, 3, 3];
      for (let b of bts) this.writeByte(b);
      this.writeByte(8);
      this.writeString('raptor.Component+FootPrint'); this.writeInt32(2);
      for (let i = 4; i <= 11; i++) this.writeByte(8);
      for (let i = 14; i <= 17; i++) this.writeByte(1);
      this.writeByte(8); this.writeByte(8);
      this.writeString('System.Drawing.Rectangle'); this.writeInt32(3);
      this.writeString('System.Guid');
      this.writeString('System.Guid');
      this.writeInt32(2);
    } else {
      this.writeByte(1);
      this.writeInt32(id);
      this.writeInt32(this.classMetaIds.get('raptor.Oval'));
    }
    this.writeComponentValues(textStr, 'Oval', false, false, false, parentId, nextWriter, comment);
  }
  writeRectangle(textStr, isCall, isChild, isBefore, isAfter, parentId, nextWriter, comment = null) {
    const id = this.allocId();
    if (!this.classMetaIds.has('raptor.Rectangle')) {
      this.classMetaIds.set('raptor.Rectangle', id);
      this.writeByte(5);
      this.writeInt32(id);
      this.writeString('raptor.Rectangle');
      const members = ['_serialization_version','_FP','_text_str','_name','_proximity','_head_height','_head_width','_head_heightOrig','_head_widthOrig','_connector_length','_x_location','_y_location','_Successor','_parent','_is_child','_is_beforeChild','_is_afterChild','_full_text','_height_of_text','_char_length','_rect','_comment','_created_guid','_changed_guid','_kind'];
      this.writeInt32(members.length);
      for (let m of members) this.writeString(m);
      const bts = [0, 4, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 2, 2, 0, 0, 0, 0, 0, 0, 4, 2, 3, 3, 4];
      for (let b of bts) this.writeByte(b);
      this.writeByte(8);
      this.writeString('raptor.Component+FootPrint'); this.writeInt32(2);
      for (let i = 4; i <= 11; i++) this.writeByte(8);
      for (let i = 14; i <= 17; i++) this.writeByte(1);
      this.writeByte(8); this.writeByte(8);
      this.writeString('System.Drawing.Rectangle'); this.writeInt32(3);
      this.writeString('System.Guid');
      this.writeString('System.Guid');
      this.writeString('raptor.Rectangle+Kind_Of'); this.writeInt32(2);
      this.writeInt32(2);
    } else {
      this.writeByte(1);
      this.writeInt32(id);
      this.writeInt32(this.classMetaIds.get('raptor.Rectangle'));
    }
    this.writeComponentValues(textStr, 'Rectangle', isChild, isBefore, isAfter, parentId, nextWriter, comment);
    this.writeKind(isCall ? 1 : 0);
  }
  writeParallelogram(prompt, isInput, textStr, isChild, isBefore, isAfter, parentId, nextWriter, comment = null) {
    const id = this.allocId();
    if (!this.classMetaIds.has('raptor.Parallelogram')) {
      this.classMetaIds.set('raptor.Parallelogram', id);
      this.writeByte(5);
      this.writeInt32(id);
      this.writeString('raptor.Parallelogram');
      const members = ['_prompt','_is_input','_new_line','_input_expression','_serialization_version','_FP','_text_str','_name','_proximity','_head_height','_head_width','_head_heightOrig','_head_widthOrig','_connector_length','_x_location','_y_location','_Successor','_parent','_is_child','_is_beforeChild','_is_afterChild','_full_text','_height_of_text','_char_length','_rect','_comment','_created_guid','_changed_guid'];
      this.writeInt32(members.length);
      for (let m of members) this.writeString(m);
      const bts = [1, 0, 0, 0, 0, 4, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 2, 2, 0, 0, 0, 0, 0, 0, 4, 2, 3, 3];
      for (let b of bts) this.writeByte(b);
      this.writeByte(1); this.writeByte(1); this.writeByte(1);
      this.writeByte(8);
      this.writeString('raptor.Component+FootPrint'); this.writeInt32(2);
      for (let i = 8; i <= 15; i++) this.writeByte(8);
      for (let i = 18; i <= 21; i++) this.writeByte(1);
      this.writeByte(8); this.writeByte(8);
      this.writeString('System.Drawing.Rectangle'); this.writeInt32(3);
      this.writeString('System.Guid');
      this.writeString('System.Guid');
      this.writeInt32(2);
    } else {
      this.writeByte(1);
      this.writeInt32(id);
      this.writeInt32(this.classMetaIds.get('raptor.Parallelogram'));
    }
    this.writeObjString(prompt);
    this.writeBoolean(isInput);
    this.writeBoolean(true);
    this.writeBoolean(true);
    this.writeComponentValues(textStr, 'Parallelogram', isChild, isBefore, isAfter, parentId, nextWriter, comment);
  }
  writeIfControl(condition, thenNodes, elseNodes, isChild, isBefore, isAfter, parentId, nextWriter, comment = null) {
    const id = this.allocId();
    if (!this.classMetaIds.has('raptor.IF_Control')) {
      this.classMetaIds.set('raptor.IF_Control', id);
      this.writeByte(5);
      this.writeInt32(id);
      this.writeString('raptor.IF_Control');
      const members = ['_left_Child','_right_Child','_bottom','_min_bottom','_x_left','_y_left','_x_right','_y_right','_left_connector_y','_right_connector_y','_line_height','_is_compressed','_serialization_version','_FP','_text_str','_name','_proximity','_head_height','_head_width','_head_heightOrig','_head_widthOrig','_connector_length','_x_location','_y_location','_Successor','_parent','_is_child','_is_beforeChild','_is_afterChild','_full_text','_height_of_text','_char_length','_rect','_comment','_created_guid','_changed_guid'];
      this.writeInt32(members.length);
      for (let m of members) this.writeString(m);
      const bts = [2, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 4, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 2, 2, 0, 0, 0, 0, 0, 0, 4, 2, 3, 3];
      for (let b of bts) this.writeByte(b);
      for (let i = 2; i <= 10; i++) this.writeByte(8);
      this.writeByte(1);
      this.writeByte(8);
      this.writeString('raptor.Component+FootPrint'); this.writeInt32(2);
      for (let i = 16; i <= 23; i++) this.writeByte(8);
      for (let i = 26; i <= 29; i++) this.writeByte(1);
      this.writeByte(8); this.writeByte(8);
      this.writeString('System.Drawing.Rectangle'); this.writeInt32(3);
      this.writeString('System.Guid');
      this.writeString('System.Guid');
      this.writeInt32(2);
    } else {
      this.writeByte(1);
      this.writeInt32(id);
      this.writeInt32(this.classMetaIds.get('raptor.IF_Control'));
    }
    this.writeChain(thenNodes || [], 0, true, false, false, id);
    this.writeChain(elseNodes || [], 0, true, false, false, id);
    this.writeInt32(100); this.writeInt32(100); this.writeInt32(-100); this.writeInt32(50);
    this.writeInt32(100); this.writeInt32(50); this.writeInt32(50); this.writeInt32(50);
    this.writeInt32(25); this.writeBoolean(false);
    this.writeComponentValues(condition, 'IF_Control', isChild, isBefore, isAfter, parentId, nextWriter, comment);
  }
  writeLoop(condition, beforeNodes, afterNodes, isChild, isBefore, isAfter, parentId, nextWriter, comment = null) {
    const id = this.allocId();
    if (!this.classMetaIds.has('raptor.Loop')) {
      this.classMetaIds.set('raptor.Loop', id);
      this.writeByte(5);
      this.writeInt32(id);
      this.writeString('raptor.Loop');
      const members = ['_before_Child','_after_Child','_bottom','_min_before_bottom','_before_bottom','_after_bottom','_x_left','_y_left','_x_right','_y_right','_left_connector_y','_right_connector_y','_line_height','_LP','_is_compressed','_serialization_version','_FP','_text_str','_name','_proximity','_head_height','_head_width','_head_heightOrig','_head_widthOrig','_connector_length','_x_location','_y_location','_Successor','_parent','_is_child','_is_beforeChild','_is_afterChild','_full_text','_height_of_text','_char_length','_rect','_comment','_created_guid','_changed_guid'];
      this.writeInt32(members.length);
      for (let m of members) this.writeString(m);
      const bts = [2, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 4, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 2, 2, 0, 0, 0, 0, 0, 0, 4, 2, 3, 3];
      for (let b of bts) this.writeByte(b);
      for (let i = 2; i <= 12; i++) this.writeByte(8);
      this.writeByte(1);
      this.writeByte(8);
      this.writeString('raptor.Component+FootPrint'); this.writeInt32(2);
      for (let i = 19; i <= 26; i++) this.writeByte(8);
      for (let i = 29; i <= 32; i++) this.writeByte(1);
      this.writeByte(8); this.writeByte(8);
      this.writeString('System.Drawing.Rectangle'); this.writeInt32(3);
      this.writeString('System.Guid');
      this.writeString('System.Guid');
      this.writeInt32(2);
    } else {
      this.writeByte(1);
      this.writeInt32(id);
      this.writeInt32(this.classMetaIds.get('raptor.Loop'));
    }
    this.writeChain(beforeNodes || [], 0, true, true, false, id);
    this.writeChain(afterNodes || [], 0, true, false, true, id);
    this.writeInt32(100); this.writeInt32(50); this.writeInt32(50); this.writeInt32(50);
    this.writeInt32(-100); this.writeInt32(50); this.writeInt32(100); this.writeInt32(50);
    this.writeInt32(50); this.writeInt32(50); this.writeInt32(25);
    this.writeObjString('Loop');
    this.writeBoolean(false);
    this.writeComponentValues(condition, 'Loop', isChild, isBefore, isAfter, parentId, nextWriter, comment);
  }
  writeChain(nodes, index, isChild, isBefore, isAfter, parentId, endComment = null) {
    if (index >= nodes.length) {
      if (!isChild) {
        this.writeOval('End', false, null, null, endComment);
      } else {
        this.writeNull();
      }
      return;
    }
    const node = nodes[index];
    const nextWriter = () => this.writeChain(nodes, index + 1, isChild, isBefore, isAfter, parentId, endComment);

    if (node.type === 'assignment') {
      this.writeRectangle(`${node.variable || 'x'}:=${node.expression || '0'}`, false, isChild, isBefore, isAfter, parentId, nextWriter, node.comment || null);
    } else if (node.type === 'call') {
      this.writeRectangle(node.callName || 'sub', true, isChild, isBefore, isAfter, parentId, nextWriter, node.comment || null);
    } else if (node.type === 'input') {
      this.writeParallelogram(node.prompt || '', true, node.variable || '', isChild, isBefore, isAfter, parentId, nextWriter, node.comment || null);
    } else if (node.type === 'output') {
      this.writeParallelogram('', false, node.expression || '', isChild, isBefore, isAfter, parentId, nextWriter, node.comment || null);
    } else if (node.type === 'selection') {
      this.writeIfControl(node.condition || 'true', node.thenNodes || [], node.elseNodes || [], isChild, isBefore, isAfter, parentId, nextWriter, node.comment || null);
    } else if (node.type === 'loop') {
      this.writeLoop(node.condition || 'true', node.beforeNodes || [], node.afterNodes || [], isChild, isBefore, isAfter, parentId, nextWriter, node.comment || null);
    } else {
      nextWriter();
    }
  }

  buildAst(nodes, startComment = null, endComment = null) {
    this.write(MS_NRBF_HEADER);
    this.writeByte(12); this.writeInt32(2); this.writeString('raptor, Version=4.1.0.1, Culture=neutral, PublicKeyToken=null');
    this.writeByte(12); this.writeInt32(3); this.writeString('System.Drawing, Version=4.0.0.0, Culture=neutral, PublicKeyToken=b03f5f7f11d50a3a');
    this.writeOval('Start', true, null, () => this.writeChain(nodes || [], 0, false, false, false, null, endComment), startComment);
    this.writeByte(11);
    return this.getBuffer();
  }
}

class RapBinarySerializer {
  static makeStrStream(str) {
    const strBytes = Buffer.from(str || '', 'utf8');
    let n = strBytes.length;
    const varint = [];
    while (true) {
      const byte = n & 0x7f;
      n >>= 7;
      if (n > 0) varint.push(byte | 0x80);
      else { varint.push(byte); break; }
    }
    return Buffer.concat([
      MS_NRBF_HEADER,
      Buffer.from([0x06, 0x01, 0x00, 0x00, 0x00]),
      Buffer.from(varint),
      strBytes,
      Buffer.from([0x0b])
    ]);
  }

  static serialize(flowchart) {
    const tabs = (flowchart && flowchart.tabs && flowchart.tabs.length > 0) ? flowchart.tabs : [{ name: 'main', nodes: [] }];
    const tabCount = tabs.length;

    const outStreams = [];

    // Stream 0: Version 17
    const stream0 = Buffer.from('0001000000ffffffff010000000000000004010000000c53797374656d2e496e74333201000000076d5f76616c75650008110000000b', 'hex');
    outStreams.push(stream0);

    // Stream 1: Reverse loop logic = false
    const stream1 = Buffer.from('0001000000ffffffff010000000000000004010000000e53797374656d2e426f6f6c65616e01000000076d5f76616c75650001000b', 'hex');
    outStreams.push(stream1);

    // Stream 2: Tab count
    const stream2 = Buffer.from('0001000000ffffffff010000000000000004010000000c53797374656d2e496e74333201000000076d5f76616c75650008000000000b', 'hex');
    stream2.writeInt32LE(tabCount, stream2.length - 5);
    outStreams.push(stream2);

    // Tab descriptors: Name & Subchart_Kind (0 = Subchart)
    const subchartKindStream = Buffer.from('0001000000ffffffff01000000000000000c020000003d726170746f722c2056657273696f6e3d342e312e302e312c2043756c747572653d6e65757472616c2c205075626c69634b6579546f6b656e3d6e756c6c050100000015726170746f722e53756263686172745f4b696e6473010000000776616c75655f5f000802000000000000000b', 'hex');
    for (let i = 0; i < tabCount; i++) {
      outStreams.push(RapBinarySerializer.makeStrStream(tabs[i].name));
      outStreams.push(subchartKindStream);
    }

    // Tab ASTs & Ink streams
    const inkStream = Buffer.from('0001000000ffffffff01000000000000000f010000000100000002000b', 'hex');
    for (let i = 0; i < tabCount; i++) {
      const gen = new AstGenerator();
      const astBuf = gen.buildAst(tabs[i].nodes || [], tabs[i].startComment || null, tabs[i].endComment || null);
      outStreams.push(astBuf);
      outStreams.push(inkStream);
    }

    // Trailing streams:
    // logging_info
    const loggingStream = Buffer.from('0001000000ffffffff01000000000000000c020000003d726170746f722c2056657273696f6e3d342e312e302e312c2043756c747572653d6e65757472616c2c205075626c69634b6579546f6b656e3d6e756c6c050100000013726170746f722e6c6f6767696e675f696e666f02000000165f73657269616c697a6174696f6e5f76657273696f6e065f636f756e74000008080200000011000000000000000b', 'hex');
    outStreams.push(loggingStream);

    // compiled_flowchart = false
    const compiledStream = Buffer.from('0001000000ffffffff010000000000000004010000000e53797374656d2e426f6f6c65616e01000000076d5f76616c75650001000b', 'hex');
    outStreams.push(compiledStream);

    // file_guid
    const guidStream = Buffer.from('0001000000ffffffff010000000000000004010000000b53797374656d2e477569640b000000025f61025f62025f63025f64025f65025f66025f67025f68025f69025f6a025f6b00000000000000000000000807070202020202020202423e16e0610cd24e844aa2351d08d0f50b', 'hex');
    outStreams.push(guidStream);

    const binaryBuf = Buffer.concat(outStreams);
    const jsonTrailer = Buffer.from(
      '\n/*RAPTOR_MACOS_FLOWCHART_JSON_BEGIN*/\n' +
      JSON.stringify(flowchart, null, 2) +
      '\n/*RAPTOR_MACOS_FLOWCHART_JSON_END*/\n',
      'utf8'
    );
    return Buffer.concat([binaryBuf, jsonTrailer]);
  }
}

if (typeof module !== 'undefined') {
  module.exports = { NrbfStreamParser, RapBinaryParser, RapBinarySerializer };
}

if (typeof globalThis !== 'undefined' && globalThis.window) {
  globalThis.window.NrbfStreamParser = NrbfStreamParser;
  globalThis.window.RapBinaryParser = RapBinaryParser;
  globalThis.window.RapBinarySerializer = RapBinarySerializer;
}
