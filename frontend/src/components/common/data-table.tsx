import {
  ActionIcon,
  Alert,
  Checkbox,
  Group,
  Menu,
  Pagination,
  Paper,
  ScrollArea,
  Skeleton,
  Stack,
  Table,
  Text,
  TextInput,
  ThemeIcon,
  UnstyledButton,
} from "@mantine/core";
import {
  IconAlertCircle,
  IconChevronDown,
  IconChevronUp,
  IconDotsVertical,
  IconSearch,
  IconSelector,
} from "@tabler/icons-react";
import { useState } from "react";
import { useNavigate } from "react-router";

// Types for the data table component
export interface DataTableColumn<T> {
  accessor: keyof T | ((item: T) => any);
  title: string;
  sortable?: boolean;
  render?: (value: any, item: T) => React.ReactNode;
  width?: string;
  textAlign?: "left" | "center" | "right";
  hidden?: boolean;
}

export interface DataTableProps<T> {
  data: T[] | null;
  columns: DataTableColumn<T>[];
  isLoading?: boolean;
  error?: string | null;
  totalItems?: number;
  onPageChange?: (page: number) => void;
  currentPage?: number;
  itemsPerPage?: number;
  onItemsPerPageChange?: (itemsPerPage: number) => void;
  selectable?: boolean;
  onSelectedItemsChange?: (selectedItems: T[]) => void;
  rowActions?: {
    label: string;
    icon?: React.ReactNode;
    onClick: (item: T) => void;
  }[];
  onRowClick?: (item: T) => void;
  detailRoute?: string; // e.g., "/properties/:id"
  idAccessor?: keyof T;
  emptyMessage?: string;
  showPagination?: boolean;
  actionComponent?: React.ReactNode;
}

export function DataTable<T>({
  data,
  columns,
  isLoading = false,
  error = null,
  totalItems = 0,
  onPageChange,
  currentPage = 1,
  itemsPerPage = 10,
  onItemsPerPageChange,
  selectable = false,
  onSelectedItemsChange,
  rowActions = [],
  onRowClick,
  detailRoute,
  idAccessor = "id" as keyof T,
  emptyMessage = "No data to display",
  showPagination = true,
  actionComponent,
}: DataTableProps<T>) {
  const [sortColumn, setSortColumn] = useState<keyof T | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [selectedItems, setSelectedItems] = useState<T[]>([]);
  const [searchValue, setSearchValue] = useState("");
  const navigate = useNavigate();

  // Handle sort
  const handleSort = (column: keyof T) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
  };

  // Handle row selection
  const toggleRow = (item: T) => {
    const isSelected = selectedItems.some(
      (selectedItem) => selectedItem[idAccessor] === item[idAccessor]
    );

    let newSelectedItems: T[];

    if (isSelected) {
      newSelectedItems = selectedItems.filter(
        (selectedItem) => selectedItem[idAccessor] !== item[idAccessor]
      );
    } else {
      newSelectedItems = [...selectedItems, item];
    }

    setSelectedItems(newSelectedItems);

    if (onSelectedItemsChange) {
      onSelectedItemsChange(newSelectedItems);
    }
  };

  // Handle "select all" checkbox
  const toggleAll = () => {
    if (!data) return;

    let newSelectedItems: T[];

    if (selectedItems.length === data.length) {
      newSelectedItems = [];
    } else {
      newSelectedItems = [...data];
    }

    setSelectedItems(newSelectedItems);

    if (onSelectedItemsChange) {
      onSelectedItemsChange(newSelectedItems);
    }
  };

  // Handle row click (navigate to detail view)
  const handleRowClick = (item: T) => {
    if (onRowClick) {
      onRowClick(item);
    } else if (detailRoute) {
      const itemId = item[idAccessor] as unknown as string;
      const route = detailRoute.replace(":id", itemId);
      navigate(route);
    }
  };

  // Filter visible columns
  const visibleColumns = columns.filter((column) => !column.hidden);

  // Render sortable header
  const Th = ({
    column,
    children,
  }: {
    column: DataTableColumn<T>;
    children: React.ReactNode;
  }) => {
    const accessor =
      typeof column.accessor === "function" ? null : column.accessor;

    return (
      <th style={{ width: column.width }}>
        {column.sortable && accessor ? (
          <UnstyledButton
            onClick={() => handleSort(accessor)}
            style={{
              display: "flex",
              alignItems: "center",
              width: "100%",
              padding: "0 8px",
            }}
          >
            <Group position="apart" w="100%" noWrap>
              <Text fw={500} size="sm">
                {column.title}
              </Text>
              {sortColumn === accessor ? (
                sortDirection === "asc" ? (
                  <IconChevronUp size={14} stroke={1.5} />
                ) : (
                  <IconChevronDown size={14} stroke={1.5} />
                )
              ) : (
                <IconSelector size={14} stroke={1.5} />
              )}
            </Group>
          </UnstyledButton>
        ) : (
          <Text
            fw={500}
            size="sm"
            style={{ textAlign: column.textAlign || "left" }}
          >
            {column.title}
          </Text>
        )}
      </th>
    );
  };

  // Generate table rows
  const rows = data?.map((item) => (
    <tr
      key={String(item[idAccessor])}
      onClick={(e) => {
        if (
          e.target instanceof HTMLElement &&
          (e.target.closest("button") || e.target.closest("input"))
        ) {
          return;
        }
        handleRowClick(item);
      }}
      style={{ cursor: onRowClick || detailRoute ? "pointer" : "default" }}
      className="clickable-row"
    >
      {selectable && (
        <td onClick={(e) => e.stopPropagation()}>
          <Checkbox
            checked={selectedItems.some(
              (selectedItem) => selectedItem[idAccessor] === item[idAccessor]
            )}
            onChange={() => toggleRow(item)}
          />
        </td>
      )}

      {visibleColumns.map((column, i) => {
        const accessor = column.accessor;
        const value =
          typeof accessor === "function" ? accessor(item) : item[accessor];

        return (
          <td key={i} style={{ textAlign: column.textAlign || "left" }}>
            {column.render ? column.render(value, item) : value}
          </td>
        );
      })}

      {rowActions.length > 0 && (
        <td onClick={(e) => e.stopPropagation()}>
          <Menu position="bottom-end" withArrow shadow="md">
            <Menu.Target>
              <ActionIcon variant="subtle">
                <IconDotsVertical size="1rem" />
              </ActionIcon>
            </Menu.Target>

            <Menu.Dropdown>
              {rowActions.map((action, i) => (
                <Menu.Item
                  key={i}
                  leftSection={action.icon}
                  onClick={() => action.onClick(item)}
                >
                  {action.label}
                </Menu.Item>
              ))}
            </Menu.Dropdown>
          </Menu>
        </td>
      )}
    </tr>
  ));

  // Loading skeleton
  const loadingSkeleton = (
    <Table>
      <thead>
        <tr>
          {selectable && <th style={{ width: 40 }}></th>}
          {visibleColumns.map((column, i) => (
            <th key={i} style={{ width: column.width }}>
              <Skeleton height={20} width="80%" radius="sm" />
            </th>
          ))}
          {rowActions.length > 0 && <th style={{ width: 40 }}></th>}
        </tr>
      </thead>
      <tbody>
        {Array.from({ length: 5 }).map((_, i) => (
          <tr key={i}>
            {selectable && (
              <td>
                <Skeleton height={18} circle />
              </td>
            )}
            {visibleColumns.map((_, j) => (
              <td key={j}>
                <Skeleton height={20} radius="sm" />
              </td>
            ))}
            {rowActions.length > 0 && (
              <td>
                <Skeleton height={24} width={24} radius="sm" />
              </td>
            )}
          </tr>
        ))}
      </tbody>
    </Table>
  );

  // Error display
  if (error) {
    return (
      <Paper p="md" withBorder>
        <Alert icon={<IconAlertCircle size="1rem" />} title="Error" color="red">
          {error}
        </Alert>
      </Paper>
    );
  }

  // Empty state
  if (!isLoading && (!data || data.length === 0)) {
    return (
      <Paper p="xl" withBorder>
        <Stack align="center" spacing="md">
          <ThemeIcon size={48} radius="xl" color="gray">
            <IconSearch size={24} />
          </ThemeIcon>
          <Text c="dimmed" ta="center">
            {emptyMessage}
          </Text>
          {actionComponent}
        </Stack>
      </Paper>
    );
  }

  // Table header (with search and action buttons)
  const tableHeader = (
    <Group position="apart" mb="md">
      <TextInput
        placeholder="Search..."
        icon={<IconSearch size="0.9rem" stroke={1.5} />}
        value={searchValue}
        onChange={(e) => setSearchValue(e.currentTarget.value)}
        w={300}
      />

      {actionComponent}
    </Group>
  );

  // Total pages calculation for pagination
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  return (
    <div>
      {tableHeader}

      <ScrollArea>
        <Table striped highlightOnHover>
          <thead>
            <tr>
              {selectable && (
                <th style={{ width: 40 }}>
                  <Checkbox
                    onChange={toggleAll}
                    checked={
                      data &&
                      data.length > 0 &&
                      selectedItems.length === data.length
                    }
                    indeterminate={
                      selectedItems.length > 0 &&
                      data &&
                      selectedItems.length < data.length
                    }
                  />
                </th>
              )}

              {visibleColumns.map((column, i) => (
                <Th key={i} column={column}>
                  {column.title}
                </Th>
              ))}

              {rowActions.length > 0 && <th style={{ width: 40 }}></th>}
            </tr>
          </thead>
          <tbody>{isLoading ? loadingSkeleton : rows}</tbody>
        </Table>
      </ScrollArea>

      {showPagination && totalPages > 1 && (
        <Group position="right" mt="md">
          <Pagination
            total={totalPages}
            value={currentPage}
            onChange={onPageChange}
          />
        </Group>
      )}
    </div>
  );
}
