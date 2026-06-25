import { InlineEditable } from "@/components/prompt-builder/InlineEditable"
import {
  useCanEditBlockContent,
  useCanEditBlockStructure,
  useIsAdminPreview,
  useIsPreviewMode,
} from "@/hooks/use-builder-editor-mode"
import {
  deleteTableColumn,
  deleteTableRow,
  reorderTableColumns,
  reorderTableRows,
  tableColumnCount,
} from "@/lib/table-structure"
import {
  closestCenter,
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  type CollisionDetection,
  type DragEndEvent,
  type DraggableAttributes,
} from "@dnd-kit/core"
import {
  SortableContext,
  useSortable,
  horizontalListSortingStrategy,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { GripVertical, Trash2 } from "lucide-react"
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type MouseEvent,
  type ReactNode,
} from "react"

const ADD_COL_WIDTH_PX = 72
const ROW_GRIP_WIDTH_PX = 24
const ROW_DELETE_WIDTH_PX = 24
/** Shared inner layout — header reserves icon slots; body mirrors with spacers. */
function dataColumnInnerClass(dense: boolean): string {
  return dense
    ? "flex min-w-0 items-start gap-1.5 py-0 pl-2 pr-2"
    : "flex min-w-0 items-start gap-1.5 py-0 pl-2 pr-3"
}

type ColumnDragState = {
  transform?: string
  transition?: string
  isDragging: boolean
}

type ColumnGripHandle = {
  attributes: DraggableAttributes
  listeners: Record<string, unknown> | undefined
}

function dataColumnTextPadClass(dense: boolean): string {
  return dense ? "px-2 py-0" : "px-2 py-0"
}

type Props = {
  blockId: string
  headers: string[]
  rows: string[][]
  variant?: string
  dense?: boolean
  onHeadersChange: (headers: string[]) => void
  onRowsChange: (rows: string[][]) => void
}

function padToLength(values: string[], length: number, fill = ""): string[] {
  const next = [...values]
  while (next.length < length) next.push(fill)
  return next.slice(0, length)
}

function defaultColumnLabel(index: number): string {
  return `Column ${String.fromCharCode(65 + index)}`
}

function dataColumnWidth(
  count: number,
  addColVisible: boolean,
  withRowEdgeColumns: boolean,
): string {
  if (!withRowEdgeColumns) {
    return `${100 / count}%`
  }
  const edgeWidth =
    ROW_GRIP_WIDTH_PX +
    ROW_DELETE_WIDTH_PX +
    (addColVisible ? ADD_COL_WIDTH_PX : 0)
  return `calc((100% - ${edgeWidth}px) / ${count})`
}

function dataColumnShellClass(
  variant: string,
  dense: boolean,
  kind: "th" | "td",
): string {
  if (variant === "striped") {
    return kind === "th"
      ? `w-full min-w-0 align-top px-0 text-left font-medium ${dense ? "py-1" : "py-2"}`
      : `w-full min-w-0 cursor-text align-top border-t border-gray-100 px-0 text-gray-800 ${dense ? "py-1" : "py-2"}`
  }
  if (variant === "minimal") {
    return kind === "th"
      ? `w-full min-w-0 cursor-text align-top border-b border-gray-300 px-0 text-left font-semibold text-gray-800 ${dense ? "py-1" : "py-2"}`
      : `w-full min-w-0 cursor-text align-top px-0 text-gray-700 ${dense ? "py-1" : "py-2"}`
  }
  return kind === "th"
    ? `w-full min-w-0 cursor-text align-top px-0 text-left font-semibold text-gray-600 ${dense ? "py-1" : "py-2"}`
    : `w-full min-w-0 cursor-text align-top px-0 text-gray-800 ${dense ? "py-1" : "py-2"}`
}

function HeaderColumnLayout({
  dense,
  content,
  trailing,
}: {
  dense: boolean
  content: ReactNode
  trailing: ReactNode
}) {
  return (
    <div className={dataColumnInnerClass(dense)}>
      <div className="min-w-0 flex-1">{content}</div>
      <div className="flex w-5 shrink-0 justify-center pt-0.5">{trailing}</div>
    </div>
  )
}

function BodyColumnContent({
  dense,
  content,
}: {
  dense: boolean
  content: ReactNode
}) {
  return <div className={dataColumnTextPadClass(dense)}>{content}</div>
}

function tableDragPrefix(id: string | number): "row" | "col" | null {
  const value = String(id)
  if (value.startsWith("row-")) return "row"
  if (value.startsWith("col-")) return "col"
  return null
}

const tableCollisionDetection: CollisionDetection = (args) => {
  const prefix = tableDragPrefix(args.active.id)
  if (!prefix) return closestCenter(args)

  return closestCenter({
    ...args,
    droppableContainers: args.droppableContainers.filter(
      (container) => tableDragPrefix(container.id) === prefix,
    ),
  })
}

function StructureIconButton({
  label,
  onClick,
  disabled,
  children,
  className = "",
}: {
  label: string
  onClick?: (event: MouseEvent<HTMLButtonElement>) => void
  disabled?: boolean
  children: ReactNode
  className?: string
}) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className={`flex size-5 shrink-0 items-center justify-center rounded text-gray-300 transition-colors hover:bg-gray-100 hover:text-gray-600 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-gray-300 ${className}`}
    >
      {children}
    </button>
  )
}

function columnCellDragStyle(state?: ColumnDragState): CSSProperties | undefined {
  if (!state?.transform && !state?.isDragging) return undefined
  return {
    transform: state.transform,
    transition: state.transition,
    position: state.isDragging ? "relative" : undefined,
    zIndex: state.isDragging ? 10 : undefined,
    opacity: state.isDragging ? 0.92 : undefined,
    backgroundColor: state.isDragging ? "rgba(239, 246, 255, 0.65)" : undefined,
  }
}

type SortableColumnProps = {
  id: string
  colIndex: number
  dense: boolean
  canDelete: boolean
  onDelete: () => void
  className: string
  children: ReactNode
  controlsOnly?: boolean
  onMouseEnter?: () => void
  onMouseLeave?: (event: MouseEvent<HTMLTableCellElement>) => void
  controlsTone?: "light" | "dark"
  onDragStateChange: (colIndex: number, state: ColumnDragState | null) => void
  onRegisterGrip: (colIndex: number, handle: ColumnGripHandle | null) => void
}

function SortableTableColumn({
  id,
  colIndex,
  dense,
  canDelete,
  onDelete,
  className,
  children,
  controlsOnly = false,
  onMouseEnter,
  onMouseLeave,
  controlsTone = "light",
  onDragStateChange,
  onRegisterGrip,
}: SortableColumnProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id })

  const dragTransform = CSS.Transform.toString(transform)

  useEffect(() => {
    onDragStateChange(colIndex, {
      transform: dragTransform,
      transition,
      isDragging,
    })
    if (!isDragging) {
      return () => onDragStateChange(colIndex, null)
    }
    return undefined
  }, [colIndex, dragTransform, isDragging, onDragStateChange, transition])

  useEffect(() => {
    onRegisterGrip(colIndex, {
      attributes,
      listeners: listeners as Record<string, unknown> | undefined,
    })
    return () => onRegisterGrip(colIndex, null)
  }, [attributes, colIndex, listeners, onRegisterGrip])

  const controlButtonClass =
    controlsTone === "dark"
      ? "text-gray-400 hover:bg-white/10 hover:text-gray-200"
      : "text-gray-300 hover:bg-gray-100 hover:text-gray-600"

  const headerStyle = columnCellDragStyle({
    transform: dragTransform,
    transition,
    isDragging,
  })

  return (
    <th
      ref={setNodeRef}
      style={headerStyle}
      data-col-index={colIndex}
      className={`group/col ${className}`}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <HeaderColumnLayout
        dense={dense}
        content={
          controlsOnly ? <span className="block min-h-5" aria-hidden /> : children
        }
        trailing={
          <StructureIconButton
            label="Delete column"
            disabled={!canDelete}
            className={`opacity-0 transition-opacity group-hover/col:opacity-100 ${controlButtonClass}`}
            onClick={(event) => {
              event.stopPropagation()
              onDelete()
            }}
          >
            <Trash2 className="size-3" />
          </StructureIconButton>
        }
      />
    </th>
  )
}

type SortableRowProps = {
  id: string
  canDelete: boolean
  onDelete: () => void
  rowClassName: string
  gripCellClassName: string
  deleteCellClassName: string
  children: ReactNode
  trailingCell?: ReactNode
}

function SortableTableRow({
  id,
  canDelete,
  onDelete,
  rowClassName,
  gripCellClassName,
  deleteCellClassName,
  children,
  trailingCell,
}: SortableRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <tr
      ref={setNodeRef}
      style={style}
      className={`group/row ${rowClassName} ${
        isDragging ? "relative z-10 opacity-90" : ""
      }`}
    >
      <td className={gripCellClassName}>
        <div className="flex justify-center opacity-0 transition-opacity group-hover/row:opacity-100">
          <button
            type="button"
            aria-label="Drag to reorder row"
            className="flex size-5 shrink-0 cursor-grab touch-none items-center justify-center rounded text-gray-300 transition-colors hover:bg-gray-100 hover:text-gray-600 active:cursor-grabbing"
            onClick={(event) => event.stopPropagation()}
            {...attributes}
            {...listeners}
          >
            <GripVertical className="size-3" />
          </button>
        </div>
      </td>
      {children}
      <td className={deleteCellClassName}>
        <div className="flex justify-center opacity-0 transition-opacity group-hover/row:opacity-100">
          <StructureIconButton
            label="Delete row"
            disabled={!canDelete}
            onClick={(event) => {
              event.stopPropagation()
              onDelete()
            }}
          >
            <Trash2 className="size-3" />
          </StructureIconButton>
        </div>
      </td>
      {trailingCell}
    </tr>
  )
}

export function EditableDataTable({
  blockId,
  headers,
  rows,
  variant = "standard",
  dense = false,
  onHeadersChange,
  onRowsChange,
}: Props) {
  const isPreview = useIsPreviewMode()
  const isAdminPreview = useIsAdminPreview()
  const canEditContent = useCanEditBlockContent(blockId)
  const canEditStructure = useCanEditBlockStructure()
  const showTableControls =
    canEditContent && canEditStructure && !isPreview && !isAdminPreview
  const [addColHover, setAddColHover] = useState(false)
  const [hoveredColIndex, setHoveredColIndex] = useState<number | null>(null)
  const [columnDragStates, setColumnDragStates] = useState<
    Record<number, ColumnDragState>
  >({})
  const colGripHandlesRef = useRef<Record<number, ColumnGripHandle>>({})

  const registerColGrip = useCallback(
    (colIndex: number, handle: ColumnGripHandle | null) => {
      if (handle) {
        colGripHandlesRef.current[colIndex] = handle
        return
      }
      delete colGripHandlesRef.current[colIndex]
    },
    [],
  )

  const draggingColIndex = Object.entries(columnDragStates).find(
    ([, state]) => state.isDragging,
  )?.[0]

  const gripColIndex =
    draggingColIndex !== undefined
      ? Number(draggingColIndex)
      : hoveredColIndex

  const activeColGrip =
    gripColIndex !== null ? colGripHandlesRef.current[gripColIndex] : undefined

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
  )

  const textSize = dense ? "text-[10px]" : "text-[12px]"

  const columns = tableColumnCount(headers, rows)
  const rowIds = useMemo(
    () => rows.map((_, index) => `row-${index}`),
    [rows],
  )
  const colIds = useMemo(
    () => Array.from({ length: columns }, (_, index) => `col-${index}`),
    [columns],
  )

  const handleColumnDragStateChange = useCallback(
    (colIndex: number, state: ColumnDragState | null) => {
      setColumnDragStates((prev) => {
        if (!state) {
          if (!(colIndex in prev)) return prev
          const next = { ...prev }
          delete next[colIndex]
          return next
        }
        return { ...prev, [colIndex]: state }
      })
    },
    [],
  )

  const clearColumnDragStates = useCallback(() => {
    setColumnDragStates({})
  }, [])

  const updateHeader = (index: number, value: string) => {
    onHeadersChange(headers.map((header, i) => (i === index ? value : header)))
  }

  const updateCell = (rowIndex: number, colIndex: number, value: string) => {
    onRowsChange(
      rows.map((row, ri) =>
        ri === rowIndex
          ? padToLength(
              row.map((cell, ci) => (ci === colIndex ? value : cell)),
              columns,
            )
          : row,
      ),
    )
  }

  const handleAddRow = () => {
    onRowsChange([...rows, Array(columns).fill("")])
  }

  const handleAddColumn = () => {
    const nextCols = columns + 1

    if (headers.length > 0) {
      const nextHeaders = padToLength(headers, nextCols, "")
      if (!nextHeaders[columns]?.trim()) {
        nextHeaders[columns] = defaultColumnLabel(columns)
      }
      onHeadersChange(nextHeaders)
    }

    const nextRows =
      rows.length > 0
        ? rows.map((row) => padToLength(row, nextCols, ""))
        : [Array(nextCols).fill("")]
    onRowsChange(nextRows)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    clearColumnDragStates()

    const { active, over } = event
    if (!over || active.id === over.id) return

    const activePrefix = tableDragPrefix(active.id)
    const overPrefix = tableDragPrefix(over.id)
    if (!activePrefix || activePrefix !== overPrefix) return

    if (activePrefix === "row") {
      const fromIndex = rowIds.indexOf(String(active.id))
      const toIndex = rowIds.indexOf(String(over.id))
      if (fromIndex < 0 || toIndex < 0) return
      onRowsChange(reorderTableRows(rows, fromIndex, toIndex))
      return
    }

    const fromIndex = colIds.indexOf(String(active.id))
    const toIndex = colIds.indexOf(String(over.id))
    if (fromIndex < 0 || toIndex < 0) return
    const next = reorderTableColumns(headers, rows, fromIndex, toIndex)
    onHeadersChange(next.headers)
    onRowsChange(next.rows)
  }

  const thClass =
    variant === "striped"
      ? `w-full min-w-0 cursor-text align-top px-2 py-1.5 text-left font-medium ${dense ? "px-2 py-1" : "px-3 py-2"}`
      : variant === "minimal"
        ? `w-full min-w-0 cursor-text align-top border-b border-gray-300 py-1.5 text-left font-semibold text-gray-800 ${dense ? "py-1 px-3" : "py-2 px-3"}`
        : `w-full min-w-0 cursor-text align-top py-1.5 pl-2 pr-3 text-left font-semibold text-gray-600 ${dense ? "py-1" : "py-2 pl-2 pr-3"}`

  const tdClass =
    variant === "striped"
      ? `w-full min-w-0 cursor-text align-top border-t border-gray-100 text-gray-800 ${dense ? "px-2 py-1" : "px-3 py-2"}`
      : variant === "minimal"
        ? `w-full min-w-0 cursor-text align-top text-gray-700 ${dense ? "py-1" : "py-2"}`
        : `w-full min-w-0 cursor-text align-top text-gray-800 ${dense ? "py-1 pl-2 pr-3" : "py-2 pl-2 pr-3"}`

  const rowGripCellClass =
    variant === "striped"
      ? "border-t border-gray-100 align-middle px-0 py-1"
      : "align-middle px-0 py-1"

  const rowDeleteCellClass = rowGripCellClass

  const tableClass =
    variant === "striped"
      ? `w-full table-fixed border-collapse rounded-lg border border-gray-200 ${textSize}`
      : `w-full table-fixed border-collapse ${textSize}`

  const theadClass =
    variant === "striped"
      ? "bg-gray-800 text-white"
      : variant === "table" || variant === "standard"
        ? "border-b-2 border-gray-200 bg-gray-50"
        : ""

  const columnControlHeaderClass =
    variant === "striped"
      ? "border-b border-gray-700 bg-gray-800 px-0 py-1"
      : "border-b border-gray-200 bg-gray-50 px-0 py-1"

  const edgeSpacerClass =
    variant === "striped"
      ? "border-b border-gray-700 bg-gray-800 px-0 py-1"
      : "border-b border-gray-200 bg-gray-50 px-0 py-1"

  const showHeader = headers.length > 0
  const lastRowIndex = rows.length - 1
  const emptyTable = rows.length === 0
  const canDeleteRow = rows.length > 1
  const canDeleteColumn = columns > 1

  const slotLabelClass = dense
    ? "text-[9px] font-medium text-gray-400"
    : "text-[10px] font-medium text-gray-400"

  const slotPadding = dense ? "px-2 py-1" : "px-3 py-1.5"

  const addSlotBaseClass = `cursor-pointer bg-gray-50/40 text-center transition-colors duration-150 hover:bg-blue-50/50 hover:text-blue-600 ${slotPadding}`

  const addSlotLabelClass = `${slotLabelClass} block leading-tight`

  const shellRevealRow =
    "[.table-shell:has(.last-row:hover)_&]:max-h-12 [.table-shell:has(.last-row:hover)_&]:opacity-100 [.table-shell:has(.add-row-slot:hover)_&]:max-h-12 [.table-shell:has(.add-row-slot:hover)_&]:opacity-100"

  const addRowSlotClass = emptyTable
    ? "add-row-slot"
    : `add-row-slot max-h-0 overflow-hidden opacity-0 transition-all duration-150 ${shellRevealRow}`

  const addRowCellClass = `${addSlotBaseClass} add-row-slot border-t border-dashed border-gray-200`

  const addColSlotClass = addColHover
    ? `${addSlotBaseClass} add-col-slot border-l border-dashed border-gray-200 opacity-100`
    : "add-col-slot w-0 max-w-0 overflow-hidden border-0 p-0 opacity-0"

  const revealAddCol = () => setAddColHover(true)

  const renderAddSlotLabel = (label: string) => (
    <span className={addSlotLabelClass}>{label}</span>
  )

  const renderAddColSlot = (label: string, as: "th" | "td") => {
    const Cell = as
    return (
      <Cell
        role="button"
        tabIndex={0}
        className={`${addColSlotClass} align-middle`}
        onMouseEnter={revealAddCol}
        onClick={(e) => {
          e.stopPropagation()
          handleAddColumn()
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault()
            handleAddColumn()
          }
        }}
      >
        {label ? renderAddSlotLabel(label) : null}
      </Cell>
    )
  }

  const tableMarkup = (
    <table className={tableClass}>
      <colgroup>
        {showTableControls && (
          <col style={{ width: `${ROW_GRIP_WIDTH_PX}px` }} />
        )}
        {Array.from({ length: columns }, (_, index) => (
          <col
            key={index}
            style={{
              width: dataColumnWidth(
                columns,
                addColHover && showTableControls,
                showTableControls,
              ),
            }}
          />
        ))}
        {showTableControls && (
          <>
            <col style={{ width: `${ROW_DELETE_WIDTH_PX}px` }} />
            <col
              style={{
                width: addColHover ? `${ADD_COL_WIDTH_PX}px` : 0,
              }}
            />
          </>
        )}
      </colgroup>
      {(showHeader || (showTableControls && !showHeader)) && (
        <thead>
          <SortableContext
            items={colIds}
            strategy={horizontalListSortingStrategy}
          >
            <tr className={showHeader ? theadClass : ""}>
              {showTableControls && (
                <th
                  data-col-grip-cell
                  className={`${showHeader ? edgeSpacerClass : columnControlHeaderClass} align-middle px-0`}
                >
                  {activeColGrip && (
                    <div className="flex justify-center">
                      <button
                        type="button"
                        aria-label="Drag to reorder column"
                        className="flex size-5 shrink-0 cursor-grab touch-none items-center justify-center rounded text-gray-300 transition-colors hover:bg-gray-100 hover:text-gray-600 active:cursor-grabbing"
                        onClick={(event) => event.stopPropagation()}
                        {...activeColGrip.attributes}
                        {...activeColGrip.listeners}
                      >
                        <GripVertical className="size-3" />
                      </button>
                    </div>
                  )}
                </th>
              )}
              {Array.from({ length: columns }, (_, index) => {
                const isLastCol = index === columns - 1
                const id = colIds[index] ?? `col-${index}`

                if (!showTableControls) {
                  return (
                    <th key={id} className={thClass}>
                      <InlineEditable
                        blockId={blockId}
                        value={headers[index] ?? ""}
                        onChange={(value) => updateHeader(index, value)}
                        hoverAffordance={false}
                        width="full"
                        className="font-inherit"
                      />
                    </th>
                  )
                }

                return (
                  <SortableTableColumn
                    key={id}
                    id={id}
                    colIndex={index}
                    dense={dense}
                    canDelete={canDeleteColumn}
                    onDelete={() => {
                      const next = deleteTableColumn(headers, rows, index)
                      onHeadersChange(next.headers)
                      onRowsChange(next.rows)
                    }}
                    className={`${
                      showHeader
                        ? dataColumnShellClass(variant, dense, "th")
                        : columnControlHeaderClass
                    } ${isLastCol ? "last-col" : ""}`}
                    controlsOnly={!showHeader}
                    controlsTone={variant === "striped" && showHeader ? "dark" : "light"}
                    onMouseEnter={() => {
                      setHoveredColIndex(index)
                      if (isLastCol) revealAddCol()
                    }}
                    onMouseLeave={(event) => {
                      const to = event.relatedTarget as HTMLElement | null
                      if (to?.closest("[data-col-grip-cell]")) return
                      setHoveredColIndex(null)
                    }}
                    onDragStateChange={handleColumnDragStateChange}
                    onRegisterGrip={registerColGrip}
                  >
                    {showHeader ? (
                      <InlineEditable
                        blockId={blockId}
                        value={headers[index] ?? ""}
                        onChange={(value) => updateHeader(index, value)}
                        hoverAffordance={false}
                        width="full"
                        className="font-inherit"
                      />
                    ) : null}
                  </SortableTableColumn>
                )
              })}
              {showTableControls && (
                <>
                  <th className={edgeSpacerClass} aria-hidden />
                  {renderAddColSlot("Add column", "th")}
                </>
              )}
            </tr>
          </SortableContext>
        </thead>
      )}
      <tbody>
        <SortableContext items={rowIds} strategy={verticalListSortingStrategy}>
          {rows.map((row, rowIndex) => {
            const isLastRow = rowIndex === lastRowIndex
            const id = rowIds[rowIndex] ?? `row-${rowIndex}`

            const dataCells = Array.from({ length: columns }, (_, colIndex) => {
              const isLastCol = colIndex === columns - 1
              const cell = (
                <InlineEditable
                  blockId={blockId}
                  value={row[colIndex] ?? ""}
                  onChange={(value) => updateCell(rowIndex, colIndex, value)}
                  multiline
                  width="full"
                  hoverAffordance={false}
                />
              )

              return (
                <td
                  key={colIndex}
                  data-col-index={colIndex}
                  style={columnCellDragStyle(columnDragStates[colIndex])}
                  className={`${
                    showTableControls
                      ? dataColumnShellClass(variant, dense, "td")
                      : tdClass
                  } ${showTableControls && isLastCol ? "last-col" : ""} ${
                    showTableControls && isLastRow ? "last-row" : ""
                  }`}
                  onMouseEnter={
                    showTableControls && isLastCol ? revealAddCol : undefined
                  }
                >
                  {showTableControls ? (
                    <BodyColumnContent dense={dense} content={cell} />
                  ) : (
                    cell
                  )}
                </td>
              )
            })

            if (!showTableControls) {
              return (
                <tr
                  key={id}
                  className={
                    variant === "striped"
                      ? rowIndex % 2 === 0
                        ? "bg-gray-50"
                        : "bg-white"
                      : variant === "standard"
                        ? "border-b border-gray-100"
                        : ""
                  }
                >
                  {dataCells}
                </tr>
              )
            }

            return (
              <SortableTableRow
                key={id}
                id={id}
                canDelete={canDeleteRow}
                onDelete={() => onRowsChange(deleteTableRow(rows, rowIndex))}
                gripCellClassName={rowGripCellClass}
                deleteCellClassName={rowDeleteCellClass}
                rowClassName={
                  variant === "striped"
                    ? rowIndex % 2 === 0
                      ? "bg-gray-50"
                      : "bg-white"
                    : variant === "standard"
                      ? "border-b border-gray-100"
                      : ""
                }
                trailingCell={renderAddColSlot("", "td")}
              >
                {dataCells}
              </SortableTableRow>
            )
          })}
        </SortableContext>
        {showTableControls && (
          <tr className={addRowSlotClass}>
            <td className="bg-transparent" aria-hidden />
            <td
              colSpan={columns}
              role="button"
              tabIndex={0}
              className={addRowCellClass}
              onClick={(e) => {
                e.stopPropagation()
                handleAddRow()
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault()
                  handleAddRow()
                }
              }}
            >
              {renderAddSlotLabel("Add row")}
            </td>
            <td className="bg-transparent" aria-hidden />
            <td className={`${addColSlotClass} bg-transparent`} aria-hidden />
          </tr>
        )}
      </tbody>
    </table>
  )

  return (
    <div
      className="table-shell w-full min-w-0"
      onClick={(e) => e.stopPropagation()}
      onMouseLeave={() => {
        setAddColHover(false)
        setHoveredColIndex(null)
      }}
    >
      {showTableControls ? (
        <DndContext
          sensors={sensors}
          collisionDetection={tableCollisionDetection}
          onDragEnd={handleDragEnd}
          onDragCancel={clearColumnDragStates}
        >
          {tableMarkup}
        </DndContext>
      ) : (
        tableMarkup
      )}
    </div>
  )
}
