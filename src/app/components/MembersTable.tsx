import { useState, useMemo } from "react";
import { Badge } from "./ui/badge";
import { Input } from "./ui/input";
import { Search, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";

interface MembersTableProps {
  members: any[];
  onSelectMember: (member: any) => void;
  selectedMemberId?: string;
}

type SortConfig = {
  key: string;
  direction: "asc" | "desc" | null;
};

export function MembersTable({
  members,
  onSelectMember,
  selectedMemberId,
}: MembersTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    key: "start_date",
    direction: "desc",
  });

  const handleSort = (key: string) => {
    let direction: "asc" | "desc" = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  const getSortIcon = (key: string) => {
    if (sortConfig.key !== key)
      return <ArrowUpDown className="ml-1 w-3 h-3 text-blue-300 inline" />;
    return sortConfig.direction === "asc" ? (
      <ArrowUp className="ml-1 w-3 h-3 text-white inline" />
    ) : (
      <ArrowDown className="ml-1 w-3 h-3 text-white inline" />
    );
  };

  const filteredAndSortedMembers = useMemo(() => {
    // 1. Filter
    let result = members.filter((member) => {
      // Name/ID Search
      const searchLower = searchTerm.toLowerCase();
      const fullName =
        `${member.firstName || ""} ${member.lastName || ""}`.toLowerCase();
      const memberId = (member.id || "").toLowerCase();
      const matchesSearch =
        fullName.includes(searchLower) || memberId.includes(searchLower);

      // Status Filter
      const status = member.subscription?.status || "NO PLAN";
      const matchesStatus = statusFilter === "ALL" || status === statusFilter;

      return matchesSearch && matchesStatus;
    });

    // 2. Sort
    if (sortConfig.direction !== null) {
      result.sort((a, b) => {
        let aValue: any = "";
        let bValue: any = "";

        switch (sortConfig.key) {
          case "name":
            aValue = `${a.firstName || ""} ${a.lastName || ""}`.toLowerCase();
            bValue = `${b.firstName || ""} ${b.lastName || ""}`.toLowerCase();
            break;
          case "start_date":
            aValue = a.subscription?.startDate || "";
            bValue = b.subscription?.startDate || "";
            break;
          case "end_date":
            aValue = a.subscription?.endDate || "";
            bValue = b.subscription?.endDate || "";
            break;
          case "plan":
            aValue = a.subscription?.planName || "";
            bValue = b.subscription?.planName || "";
            break;
          case "sessions":
            aValue = a.subscription?.remainingSessions ?? -1;
            bValue = b.subscription?.remainingSessions ?? -1;
            break;
          case "status":
            aValue = a.subscription?.status || "NO PLAN";
            bValue = b.subscription?.status || "NO PLAN";
            break;
        }

        if (aValue < bValue) return sortConfig.direction === "asc" ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === "asc" ? 1 : -1;
        return 0;
      });
    }

    return result;
  }, [members, searchTerm, statusFilter, sortConfig]);

  return (
    <div className="bg-white rounded-lg shadow-lg border-2 border-blue-200 overflow-hidden">
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h3 className="text-white font-semibold whitespace-nowrap">
          Members List
        </h3>

        {/* Filter Controls */}
        <div className="flex w-full md:w-auto gap-3 items-center text-sm">
          <div className="relative w-full md:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
            <Input
              placeholder="Search Name or ID..."
              className="pl-9 h-9 bg-white text-blue-900 border-none rounded-md w-full"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="w-32">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-9 bg-white text-blue-900 border-none">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Status</SelectItem>
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="EXPIRED">Expired</SelectItem>
                <SelectItem value="CANCELLED">Cancelled</SelectItem>
                <SelectItem value="NO PLAN">No Plan</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-blue-50 border-b-2 border-blue-200">
              <TableHead
                className="text-blue-900 cursor-pointer hover:bg-blue-100 transition-colors py-3"
                onClick={() => handleSort("name")}
              >
                Name {getSortIcon("name")}
              </TableHead>
              <TableHead
                className="text-blue-900 cursor-pointer hover:bg-blue-100 transition-colors py-3"
                onClick={() => handleSort("start_date")}
              >
                Start Date {getSortIcon("start_date")}
              </TableHead>
              <TableHead
                className="text-blue-900 cursor-pointer hover:bg-blue-100 transition-colors py-3"
                onClick={() => handleSort("end_date")}
              >
                End Date {getSortIcon("end_date")}
              </TableHead>
              <TableHead
                className="text-blue-900 cursor-pointer hover:bg-blue-100 transition-colors py-3"
                onClick={() => handleSort("plan")}
              >
                Plan {getSortIcon("plan")}
              </TableHead>
              <TableHead
                className="text-blue-900 text-center cursor-pointer hover:bg-blue-100 transition-colors py-3"
                onClick={() => handleSort("sessions")}
              >
                Sessions {getSortIcon("sessions")}
              </TableHead>
              <TableHead
                className="text-blue-900 cursor-pointer hover:bg-blue-100 transition-colors py-3"
                onClick={() => handleSort("status")}
              >
                Status {getSortIcon("status")}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredAndSortedMembers.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="h-32 text-center text-gray-500 italic"
                >
                  No members found matching your search and filters.
                </TableCell>
              </TableRow>
            ) : (
              filteredAndSortedMembers.map((member) => (
                <TableRow
                  key={member.id}
                  onClick={() => onSelectMember(member)}
                  className={`cursor-pointer transition-colors border-b border-blue-100 ${
                    selectedMemberId === member.id
                      ? "bg-blue-100 border-l-4 border-l-blue-600"
                      : "hover:bg-blue-50"
                  }`}
                >
                  <TableCell className="text-blue-900 font-medium py-3">
                    {member.firstName} {member.lastName}
                    <div className="text-[10px] text-gray-500">{member.id}</div>
                  </TableCell>
                  <TableCell className="text-blue-900 py-3">
                    {member.subscription?.startDate || "-"}
                  </TableCell>
                  <TableCell className="text-blue-900 py-3">
                    {member.subscription?.endDate || "-"}
                  </TableCell>
                  <TableCell className="text-blue-900 py-3">
                    {member.subscription?.planName || "-"}
                  </TableCell>
                  <TableCell className="text-blue-900 text-center py-3 font-bold">
                    {member.subscription?.remainingSessions ?? "-"}
                  </TableCell>
                  <TableCell className="py-3">
                    <Badge
                      className={
                        member.subscription?.status === "ACTIVE"
                          ? "bg-green-600 hover:bg-green-700"
                          : member.subscription?.status === "EXPIRED"
                            ? "bg-red-600 hover:bg-red-700"
                            : "bg-gray-500 text-white"
                      }
                    >
                      {member.subscription?.status || "No Plan"}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
