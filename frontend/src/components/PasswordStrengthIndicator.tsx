import { Check, X } from "lucide-react";

interface PasswordRequirement {
  label: string;
  met: boolean;
}

interface PasswordStrengthIndicatorProps {
  password: string;
  className?: string;
}

const PasswordStrengthIndicator = ({ 
  password, 
  className = "" 
}: PasswordStrengthIndicatorProps) => {
  const requirements: PasswordRequirement[] = [
    {
      label: "At least 8 characters",
      met: password.length >= 8,
    },
    {
      label: "One uppercase letter",
      met: /[A-Z]/.test(password),
    },
    {
      label: "One lowercase letter",
      met: /[a-z]/.test(password),
    },
    {
      label: "One special character (@$!%*?&)",
      met: /[@$!%*?&]/.test(password),
    },
  ];

  const allRequirementsMet = requirements.every((req) => req.met);

  return (
    <div className={`p-4 bg-muted rounded-lg ${className}`}>
      <p className="text-sm font-medium mb-3">
        Password requirements:
      </p>
      <div className="space-y-2">
        {requirements.map((requirement, index) => (
          <div
            key={index}
            className="flex items-center gap-2 text-sm transition-colors"
          >
            {password.length > 0 ? (
              requirement.met ? (
                <Check className="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0" />
              ) : (
                <X className="w-4 h-4 text-red-600 dark:text-red-400 flex-shrink-0" />
              )
            ) : (
              <div className="w-4 h-4 flex-shrink-0 rounded-full border-2 border-muted-foreground/30" />
            )}
            <span
              className={
                password.length > 0
                  ? requirement.met
                    ? "text-green-600 dark:text-green-400"
                    : "text-red-600 dark:text-red-400"
                  : "text-muted-foreground"
              }
            >
              {requirement.label}
            </span>
          </div>
        ))}
      </div>
      {password.length > 0 && allRequirementsMet && (
        <p className="text-sm text-green-600 dark:text-green-400 font-medium mt-3">
          Password meets all requirements
        </p>
      )}
    </div>
  );
};

export default PasswordStrengthIndicator;