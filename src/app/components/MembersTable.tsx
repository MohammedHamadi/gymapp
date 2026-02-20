import { Badge } from "./ui/badge";
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

export function MembersTable({
  members,
  onSelectMember,
  selectedMemberId,
}: MembersTableProps) {
  return (
    <div className="bg-white rounded-lg shadow-lg border-2 border-blue-200 overflow-hidden">
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-3">
        <h3 className="text-white font-semibold">Members List</h3>
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-blue-50 border-b-2 border-blue-200">
              <TableHead className="text-blue-900">Name</TableHead>
              <TableHead className="text-blue-900">Start Date</TableHead>
              <TableHead className="text-blue-900">End Date</TableHead>
              <TableHead className="text-blue-900">Subscription Type</TableHead>
              <TableHead className="text-blue-900 text-center">
                Sessions Remaining
              </TableHead>
              <TableHead className="text-blue-900">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {members.map((member) => (
              <TableRow
                key={member.id}
                onClick={() => onSelectMember(member)}
                className={`cursor-pointer transition-colors border-b border-blue-100 ${
                  selectedMemberId === member.id
                    ? "bg-blue-100 border-l-4 border-l-blue-600"
                    : "hover:bg-blue-50"
                }`}
              >
                <TableCell className="text-blue-900 font-medium">
                  {member.firstName} {member.lastName}
                </TableCell>
                <TableCell className="text-blue-900">
                  {member.subscription?.startDate || "-"}
                </TableCell>
                <TableCell className="text-blue-900">
                  {member.subscription?.endDate || "-"}
                </TableCell>
                <TableCell className="text-blue-900">
                  {member.subscription?.planName || "-"}
                </TableCell>
                <TableCell className="text-blue-900 text-center">
                  {member.subscription?.remainingSessions ?? "-"}
                </TableCell>
                <TableCell>
                  <Badge
                    className={
                      member.subscription?.status === "ACTIVE"
                        ? "bg-green-600 hover:bg-green-700"
                        : "bg-red-600 hover:bg-red-700"
                    }
                  >
                    {member.subscription?.status || "No Plan"}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
