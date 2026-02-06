'use client';

import React, { useMemo } from 'react';
import { Group, Line, Text } from 'react-konva';

// ============================================================
// FieldMarkings — Hash marks, yard numbers, end zone text
// ============================================================

const MARKING_COLOR = 'rgba(255, 255, 255, 0.6)';
const YARD_NUMBER_COLOR = 'rgba(255, 255, 255, 0.5)';
const ENDZONE_TEXT_COLOR = 'rgba(255, 255, 255, 0.4)';

const HASH_MARK_LENGTH = 6;
const HASH_MARK_WIDTH = 1;
const YARD_NUMBER_FONT_SIZE = 14;
const ENDZONE_FONT_SIZE = 28;

/** NFL hash mark positions as a fraction of field width (from each sideline) */
const NFL_HASH_FRACTION = 0.348; // ~18.5 yards from sideline / 53.3
/** College hash mark positions as a fraction of field width */
const COLLEGE_HASH_FRACTION = 0.3; // ~20 yards from center -> ~40 ft from sideline

export interface FieldMarkingsProps {
  fieldWidth: number;
  fieldHeight: number;
  showHashMarks?: boolean;
  showYardNumbers?: boolean;
  showEndZoneText?: boolean;
  endZoneText?: { top?: string; bottom?: string };
  hashStyle?: 'nfl' | 'college';
}

interface HashMark {
  x: number;
  y: number;
  horizontal: boolean;
}

/**
 * Generate hash mark positions along the field.
 */
function buildHashMarks(
  fieldWidth: number,
  fieldHeight: number,
  hashFraction: number,
): HashMark[] {
  const marks: HashMark[] = [];
  const leftHashX = fieldWidth * hashFraction;
  const rightHashX = fieldWidth * (1 - hashFraction);

  // Yard line spacing (each yard line interval)
  const yardSpacing = fieldHeight / 30; // 30 yards visible by default

  // Place hash marks at every yard
  for (let yard = 1; yard < 30; yard++) {
    const y = yard * yardSpacing;

    // Left hash
    marks.push({ x: leftHashX, y, horizontal: true });
    // Right hash
    marks.push({ x: rightHashX, y, horizontal: true });
  }

  return marks;
}

/**
 * Build yard number labels at 10-yard intervals.
 */
function buildYardNumbers(
  fieldWidth: number,
  fieldHeight: number,
): { x: number; y: number; text: string; side: 'left' | 'right' }[] {
  const labels: { x: number; y: number; text: string; side: 'left' | 'right' }[] = [];
  const yardSpacing = fieldHeight / 30;

  // Yard numbers at 10-yard intervals
  // Assuming the field shows 30 yards centered, yard numbers go: 10, 20, 30 (midfield), 20, 10
  const yardMarkers = [
    { yardFromTop: 5, label: '10' },
    { yardFromTop: 10, label: '20' },
    { yardFromTop: 15, label: '30' },
    { yardFromTop: 20, label: '40' },
    { yardFromTop: 25, label: '50' },
  ];

  for (const marker of yardMarkers) {
    const y = marker.yardFromTop * yardSpacing;
    // Left side numbers
    labels.push({ x: fieldWidth * 0.08, y, text: marker.label, side: 'left' });
    // Right side numbers
    labels.push({ x: fieldWidth * 0.92, y, text: marker.label, side: 'right' });
  }

  return labels;
}

export function FieldMarkings({
  fieldWidth,
  fieldHeight,
  showHashMarks = true,
  showYardNumbers = true,
  showEndZoneText = false,
  endZoneText,
  hashStyle = 'college',
}: FieldMarkingsProps) {
  const hashFraction =
    hashStyle === 'nfl' ? NFL_HASH_FRACTION : COLLEGE_HASH_FRACTION;

  const hashMarks = useMemo(() => {
    if (!showHashMarks) return [];
    return buildHashMarks(fieldWidth, fieldHeight, hashFraction);
  }, [fieldWidth, fieldHeight, showHashMarks, hashFraction]);

  const yardNumbers = useMemo(() => {
    if (!showYardNumbers) return [];
    return buildYardNumbers(fieldWidth, fieldHeight);
  }, [fieldWidth, fieldHeight, showYardNumbers]);

  return (
    <Group listening={false}>
      {/* Hash marks */}
      {hashMarks.map((mark, i) => (
        <Line
          key={`hash-${i}`}
          points={[
            mark.x - HASH_MARK_LENGTH / 2,
            mark.y,
            mark.x + HASH_MARK_LENGTH / 2,
            mark.y,
          ]}
          stroke={MARKING_COLOR}
          strokeWidth={HASH_MARK_WIDTH}
          listening={false}
        />
      ))}

      {/* Yard numbers */}
      {yardNumbers.map((yn, i) => (
        <Text
          key={`yard-num-${i}`}
          x={yn.x}
          y={yn.y - YARD_NUMBER_FONT_SIZE / 2}
          text={yn.text}
          fontSize={YARD_NUMBER_FONT_SIZE}
          fill={YARD_NUMBER_COLOR}
          align="center"
          listening={false}
        />
      ))}

      {/* End zone text — top */}
      {showEndZoneText && endZoneText?.top && (
        <Text
          x={fieldWidth / 2}
          y={ENDZONE_FONT_SIZE / 2}
          text={endZoneText.top}
          fontSize={ENDZONE_FONT_SIZE}
          fill={ENDZONE_TEXT_COLOR}
          rotation={-90}
          align="center"
          listening={false}
        />
      )}

      {/* End zone text — bottom */}
      {showEndZoneText && endZoneText?.bottom && (
        <Text
          x={fieldWidth / 2}
          y={fieldHeight - ENDZONE_FONT_SIZE / 2}
          text={endZoneText.bottom}
          fontSize={ENDZONE_FONT_SIZE}
          fill={ENDZONE_TEXT_COLOR}
          rotation={90}
          align="center"
          listening={false}
        />
      )}
    </Group>
  );
}

export default FieldMarkings;
